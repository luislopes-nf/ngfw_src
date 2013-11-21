/**
 * $Id: SystemManagerImpl.java,v 1.00 2012/05/30 14:17:00 dmorris Exp $
 */
package com.untangle.uvm.engine;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.InetAddress;
import java.util.LinkedList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.log4j.Logger;

import com.untangle.uvm.UvmContextFactory;
import com.untangle.uvm.SettingsManager;
import com.untangle.uvm.SystemManager;
import com.untangle.uvm.SystemSettings;
import com.untangle.uvm.SnmpSettings;
import com.untangle.uvm.UvmState;
import com.untangle.uvm.ExecManagerResultReader;
import com.untangle.uvm.node.DayOfWeekMatcher;
import com.untangle.node.util.IOUtil;

/**
 * The Manager for system-related settings
 */
public class SystemManagerImpl implements SystemManager
{
    private static final String EOL = "\n";
    private static final String BLANK_LINE = EOL + EOL;
    private static final String TWO_LINES = BLANK_LINE + EOL;

    private static final String SNMP_DEFAULT_FILE_NAME = "/etc/default/snmpd";
    private static final String SNMP_CONF_FILE_NAME = "/etc/snmp/snmpd.conf";

    private static final String CRON_STRING = "* * * root /usr/share/untangle/bin/ut-upgrade.py >/dev/null 2>&1";
    private static final File CRON_FILE = new File("/etc/cron.d/untangle-upgrade");

    // 850K .......... .......... .......... .......... .......... 96% 46.6K 6s
    private static final Pattern DOWNLOAD_PATTERN = Pattern.compile(".*([0-9]+)K[ .]+([0-9%]+) *([0-9]+\\.[0-9]+[KM]).*");
    
    private final Logger logger = Logger.getLogger(this.getClass());

    private SystemSettings settings;

    private int downloadTotalFileCount;
    private int downloadCurrentFileCount;
    private String downloadCurrentFileProgress;
    private String downloadCurrentFileRate;
    
    protected SystemManagerImpl()
    {
        SettingsManager settingsManager = UvmContextFactory.context().settingsManager();
        SystemSettings readSettings = null;
        String settingsFileName = System.getProperty("uvm.settings.dir") + "/untangle-vm/" + "system.js";

        try {
            readSettings = settingsManager.load( SystemSettings.class, settingsFileName );
        } catch (SettingsManager.SettingsException e) {
            logger.warn("Failed to load settings:",e);
        }

        /**
         * If there are still no settings, just initialize
         */
        if (readSettings == null) {
            logger.warn("No settings found - Initializing new settings.");
            this.setSettings(defaultSettings());
        }
        else {
            this.settings = readSettings;
            logger.debug("Loading Settings: " + this.settings.toJSONString());
        }

        /**
         * If the settings file date is newer than the system files, re-sync them
         */
        File settingsFile = new File( settingsFileName );
        File snmpConfFile = new File( SNMP_CONF_FILE_NAME );
        File snmpDefaultFile = new File( SNMP_DEFAULT_FILE_NAME );
        if (settingsFile.lastModified() > snmpConfFile.lastModified() ||
            settingsFile.lastModified() > snmpDefaultFile.lastModified())
            syncSnmpSettings(this.settings.getSnmpSettings());

        if (! CRON_FILE.exists() )
            writeCronFile();
        
        if (settingsFile.lastModified() > CRON_FILE.lastModified())
            writeCronFile();
        
        if (settings.getSnmpSettings().isEnabled() ) 
            restartDaemon();

        logger.info("Initialized SystemManager");
    }

    public SystemSettings getSettings()
    {
        return this.settings;
    }

    public void setSettings(final SystemSettings settings)
    {
        this._setSettings( settings );
    }

    /**
     * @return the public url for the box, this is the address (may be hostname or ip address)
     */
    public String getPublicUrl()
    {
        String httpsPortStr = Integer.toString( UvmContextFactory.context().networkManager().getNetworkSettings().getHttpsPort() );
        String primaryAddressStr = "unconfigured.example.com";
        
        if ( SystemSettings.PUBLIC_URL_EXTERNAL_IP.equals( this.settings.getPublicUrlMethod() ) ) {
            InetAddress primaryAddress = UvmContextFactory.context().networkManager().getFirstWanAddress();
            if ( primaryAddress == null ) {
                logger.warn("No WAN IP found");
            } else {
                primaryAddressStr = primaryAddress.getHostAddress();
            }
        } else if ( SystemSettings.PUBLIC_URL_HOSTNAME.equals( this.settings.getPublicUrlMethod() ) ) {
            if ( UvmContextFactory.context().networkManager().getNetworkSettings().getHostName() == null ) {
                logger.warn("No hostname is configured");
            } else {
                primaryAddressStr = UvmContextFactory.context().networkManager().getNetworkSettings().getHostName();
                String domainName = UvmContextFactory.context().networkManager().getNetworkSettings().getDomainName();
                if ( domainName != null )
                    primaryAddressStr = primaryAddressStr + "." + domainName;
            }
        } else if ( SystemSettings.PUBLIC_URL_ADDRESS_AND_PORT.equals( this.settings.getPublicUrlMethod() ) ) {
            if ( this.settings.getPublicUrlAddress() == null ) {
                logger.warn("No public address configured");
            } else {
                primaryAddressStr = this.settings.getPublicUrlAddress();
                httpsPortStr = Integer.toString( this.settings.getPublicUrlPort() );
            }
        } else {
            logger.warn("Unknown public URL method: " + this.settings.getPublicUrlMethod() );
        }
        
        return primaryAddressStr + ":" + httpsPortStr;
    }

    public boolean downloadUpdates()
    {
        LinkedList<String> downloadUrls = new LinkedList<String>();

        String result = UvmContextFactory.context().execManager().execOutput( "apt-get dist-upgrade --yes --print-uris | awk '/^.http/ {print $1}'" );
        try {
            String lines[] = result.split("\\r?\\n");
            for ( String line : lines ) {
                // remove first and last character (quotes)
                String newUrl = line.substring(1, line.length()-1);
                logger.info("To Download: " + newUrl);
                downloadUrls.add( newUrl );
            }
        } catch (Exception e) {
            logger.error( "Error parsing downloads", e );
            return false;
        }

        this.downloadTotalFileCount = downloadUrls.size();
        this.downloadCurrentFileCount = 0;
        
        // run wget to fetch each each URL and track download progress
        for ( String url : downloadUrls ) {
            this.downloadCurrentFileCount++;
            
            try {
                logger.info( "Downloading " + url );
                ExecManagerResultReader reader = UvmContextFactory.context().execManager().execEvil( "wget -c --progress=dot -P /var/cache/apt/archives/ " + url );

                // read from stdout/stderr
                for ( String output = reader.readFromOutput() ; output != null ; output = reader.readFromOutput() ) {
                    String lines[] = output.split("\\r?\\n");
                    for ( String line : lines ) {
                        logger.debug("output: " + line);
                        Matcher match = DOWNLOAD_PATTERN.matcher(line);
                        if (match.matches()) {
                            int bytesDownloaded = Integer.parseInt(match.group(1)) * 1000;
                            String progress = match.group(2);
                            String speed = match.group(3);

                            this.downloadCurrentFileProgress = progress;
                            this.downloadCurrentFileRate = speed + "B/sec";

                            logger.info("progress: " + this.downloadCurrentFileProgress);
                            logger.info("speed: " + this.downloadCurrentFileRate);
                        }
                    }
                }

                Integer retCode = reader.getResult();
                if ( retCode == null || retCode != 0 ) {
                    logger.error( "Error downloading updates: wget returned " + retCode );
                    return false;
                }
                
                reader.destroy();
            } catch (Exception e) {
                logger.error( "Exception downloading updates", e );
                return false;
            }
        }
        
        return true;
    }
    
    public org.json.JSONObject getDownloadStatus()
    {
        org.json.JSONObject json = new org.json.JSONObject();

        try {
            json.put("downloadTotalFileCount", downloadTotalFileCount);
            json.put("downloadCurrentFileCount", downloadCurrentFileCount);
            json.put("downloadCurrentFileProgress", downloadCurrentFileProgress);
            json.put("downloadCurrentFileRate", downloadCurrentFileRate);
        } catch (Exception e) {
            logger.error( "Error generating WebUI startup object", e );
        }
        return json;
    }
    

    private void _setSettings( SystemSettings newSettings )
    {
        /**
         * Save the settings
         */
        SettingsManager settingsManager = UvmContextFactory.context().settingsManager();
        try {
            settingsManager.save(SystemSettings.class, System.getProperty("uvm.settings.dir") + "/" + "untangle-vm/" + "system.js", newSettings);
        } catch (SettingsManager.SettingsException e) {
            logger.warn("Failed to save settings.",e);
            return;
        }

        /**
         * Change current settings
         */
        this.settings = newSettings;
        try {logger.debug("New Settings: \n" + new org.json.JSONObject(this.settings).toString(2));} catch (Exception e) {}

        /* sync settings to disk */
        syncSnmpSettings(this.settings.getSnmpSettings());
        writeCronFile();
    }

    private SystemSettings defaultSettings()
    {
        SystemSettings newSettings = new SystemSettings();
        newSettings.setVersion(2);

        newSettings.setPublicUrlMethod( SystemSettings.PUBLIC_URL_EXTERNAL_IP );
        newSettings.setPublicUrlAddress( "hostname.example.com" );
        newSettings.setPublicUrlPort( 443 );

        SnmpSettings snmpSettings = new SnmpSettings();
        snmpSettings.setEnabled(false);
        snmpSettings.setPort(SnmpSettings.STANDARD_MSG_PORT);
        snmpSettings.setCommunityString("CHANGE_ME");
        snmpSettings.setSysContact("MY_CONTACT_INFO");
        snmpSettings.setSysLocation("MY_LOCATION");
        snmpSettings.setSendTraps(false);
        snmpSettings.setTrapHost("MY_TRAP_HOST");
        snmpSettings.setTrapCommunity("MY_TRAP_COMMUNITY");
        snmpSettings.setTrapPort(SnmpSettings.STANDARD_TRAP_PORT);

        newSettings.setSnmpSettings(snmpSettings);

        newSettings.setAutoUpgrade(true);
        newSettings.setAutoUpgradeHour(23);
        newSettings.setAutoUpgradeMinute((new java.util.Random()).nextInt(60));
        newSettings.setAutoUpgradeDays(DayOfWeekMatcher.getAnyMatcher());
            
        return newSettings;
    }

    private void syncSnmpSettings(SnmpSettings snmpSettings)
    {
        if (snmpSettings == null)
            return;
        
        writeDefaultSnmpCtlFile(snmpSettings);
        writeSnmpdConfFile(snmpSettings);
        restartDaemon();
    }

    private void writeDefaultSnmpCtlFile(SnmpSettings settings)
    {
        StringBuilder snmpdCtl = new StringBuilder();
        snmpdCtl.append("# Generated by Untangle").append(EOL);
        snmpdCtl.append("export MIBDIRS=/usr/share/snmp/mibs").append(EOL);
        snmpdCtl.append("SNMPDRUN=").
            append(settings.isEnabled()?"yes":"no").
            append(EOL);
        //Note the line below also specifies the listening port
        snmpdCtl.append("SNMPDOPTS='-Lsd -Lf /dev/null -p /var/run/snmpd.pid UDP:").
            append(Integer.toString(settings.getPort())).append("'").append(EOL);
        snmpdCtl.append("TRAPDRUN=no").append(EOL);
        snmpdCtl.append("TRAPDOPTS='-Lsd -p /var/run/snmptrapd.pid'").append(EOL);

        strToFile(snmpdCtl.toString(), SNMP_DEFAULT_FILE_NAME);
    }

    private void writeSnmpdConfFile(SnmpSettings settings)
    {

        StringBuilder snmpd_config = new StringBuilder();
        snmpd_config.append("# Generated by Untangle").append(EOL);
        snmpd_config.append("# Turn off SMUX - recommended way from the net-snmp folks").append(EOL);
        snmpd_config.append("# is to bind to a goofy IP").append(EOL);
        snmpd_config.append("smuxsocket 1.0.0.0").append(TWO_LINES);

        if(settings.isSendTraps() &&
           isNotNullOrBlank(settings.getTrapHost()) &&
           isNotNullOrBlank(settings.getTrapCommunity())) {

            snmpd_config.append("# Enable default SNMP traps to be sent").append(EOL);
            snmpd_config.append("trapsink ").
                append(settings.getTrapHost()).append(" ").
                append(settings.getTrapCommunity()).append(" ").
                append(Integer.toString(settings.getTrapPort())).
                append(BLANK_LINE);
            snmpd_config.append("# Enable traps for failed auth (this is a security appliance)").append(EOL);
            snmpd_config.append("authtrapenable  1").append(TWO_LINES);
        }
        else {
            snmpd_config.append("# Not sending traps").append(TWO_LINES);
        }

        snmpd_config.append("# Physical system location").append(EOL);
        snmpd_config.append("syslocation").append(" ").
            append(qqOrNullToDefault(settings.getSysLocation(), "location")).append(BLANK_LINE);
        snmpd_config.append("# System contact info").append(EOL);
        snmpd_config.append("syscontact").append(" ").
            append(qqOrNullToDefault(settings.getSysContact(), "contact")).append(TWO_LINES);

        snmpd_config.append("sysservices 78").append(TWO_LINES);

        // removed extension to add faceplate stats
        // no longer works
        // snmpd_config.append("pass_persist .1.3.6.1.4.1.30054 /usr/share/untangle/bin/ut-snmpd-extension.py .1.3.6.1.4.1.30054").append(EOL);

        if(isNotNullOrBlank(settings.getCommunityString())) {
            snmpd_config.append("# Simple access rules, so there is only one read").append(EOL);
            snmpd_config.append("# only connumity.").append(EOL);
            snmpd_config.append("com2sec local default ").append(settings.getCommunityString()).append(EOL);
            snmpd_config.append("group MyROGroup v1 local").append(EOL);
            snmpd_config.append("group MyROGroup v2c local").append(EOL);
            snmpd_config.append("group MyROGroup usm local").append(EOL);
            //snmpd_config.append("view mib2 included  .iso.org.dod.internet.mgmt.mib-2").append(EOL);
            //snmpd_config.append("view mib2 included  .iso.org.dod.internet.private.1.30054").append(EOL);
            //snmpd_config.append("access MyROGroup \"\" any noauth exact mib2 none none").append(EOL);
            snmpd_config.append("view mib2 included  .iso").append(EOL);
            snmpd_config.append("access MyROGroup \"\" any noauth exact mib2 none none");
        }
        else {
            snmpd_config.append("# No one has access (no community string)").append(EOL);
        }

        strToFile(snmpd_config.toString(), SNMP_CONF_FILE_NAME);
    }

    private boolean strToFile(String s, String fileName)
    {
        FileOutputStream fos = null;
        File tmp = null;
        try {

            tmp = File.createTempFile("snmpcf", ".tmp");
            fos = new FileOutputStream(tmp);
            fos.write(s.getBytes());
            fos.flush();
            fos.close();
            IOUtil.copyFile(tmp, new File(fileName));
            tmp.delete();
            return true;
        }
        catch(Exception ex) {
            IOUtil.close(fos);
            tmp.delete();
            logger.error("Unable to create SNMP control file \"" + fileName + "\"", ex);
            return false;
        }
    }

    /**
     * Note that if we've disabled SNMP support (and it was enabled)
     * forcing this "restart" actualy causes it to stop.  Doesn't sound
     * intuitive - but trust me.  The "etc/default/snmpd" file which we
     * write controls this.
     */
    private void restartDaemon()
    {
        try {
            logger.debug("Restarting the snmpd...");

            String result = UvmContextFactory.context().execManager().execOutput( "/etc/init.d/snmpd restart" );
            try {
                String lines[] = result.split("\\r?\\n");
                logger.info("/etc/init.d/snmpd restart: ");
                for ( String line : lines )
                    logger.info("/etc/init.d/snmpd restart: " + line);
            } catch (Exception e) {}

        }
        catch(Exception ex) {
            logger.error("Error restarting snmpd", ex);
        }
    }

    private boolean isNotNullOrBlank(String s)
    {
        return s != null && !"".equals(s.trim());
    }

    private String qqOrNullToDefault(String str, String def)
    {
        return isNotNullOrBlank(str)? str:def;
    }

    private void writeCronFile()
    {
        // write the cron file for nightly runs
        // FIXME dayfield
        String conf = settings.getAutoUpgradeMinute() + " " + settings.getAutoUpgradeHour() + " " + CRON_STRING;
        BufferedWriter out = null;
        try {
            out = new BufferedWriter(new FileWriter(CRON_FILE));
            out.write(conf, 0, conf.length());
            out.write("\n");
        } catch (IOException ex) {
            logger.error("Unable to write file", ex);
            return;
        }
        try {
            out.close();
        } catch (IOException ex) {
            logger.error("Unable to close file", ex);
            return;
        }
    }
}