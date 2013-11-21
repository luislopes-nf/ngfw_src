/**
 * $Id$
 */
package com.untangle.node.reporting;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.File;
import java.io.FileWriter;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.net.InetAddress;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

import com.untangle.uvm.UvmContextFactory;
import com.untangle.uvm.SettingsManager;
import com.untangle.uvm.ExecManagerResult;
import com.untangle.uvm.util.I18nUtil;
import com.untangle.uvm.node.NodeSettings;
import com.untangle.uvm.node.NodeProperties;
import com.untangle.uvm.node.IPMaskedAddress;
import com.untangle.uvm.node.Reporting;
import com.untangle.uvm.AdminManager;
import com.untangle.uvm.logging.LogEvent;
import com.untangle.uvm.vnet.NodeBase;
import com.untangle.uvm.vnet.PipeSpec;
import com.untangle.uvm.servlet.DownloadHandler;

public class ReportingNodeImpl extends NodeBase implements ReportingNode, Reporting
{
    private static final Logger logger = Logger.getLogger(ReportingNodeImpl.class);

    private static final String REPORTS_SCRIPT = System.getProperty("uvm.home") + "/bin/reporting-generate-reports.py";
    private static final String REPORTS_LOG = System.getProperty("uvm.log.dir") + "/reporter.log";

    private static final String CRON_STRING = "* * * root /usr/share/untangle/bin/reporting-generate-reports.py -d $(date \"+\\%Y-\\%m-\\%d\") > /dev/null 2>&1";
    private static final File CRON_FILE = new File("/etc/cron.d/untangle-reports-nightly");
    private static final File SYSLOG_CONF_FILE = new File("/etc/rsyslog.d/untangle-remote.conf");

    private static EventWriterImpl eventWriter = null;
    private static EventReaderImpl eventReader = null;
    private static ReportingManagerImpl reportingManager = null;

    private ReportingSettings settings;

    public ReportingNodeImpl( NodeSettings nodeSettings, NodeProperties nodeProperties )
    {
        super( nodeSettings, nodeProperties );

        if (eventWriter == null)
            eventWriter = new EventWriterImpl( this );
        if (eventReader == null)
            eventReader = new EventReaderImpl( this );
        if (reportingManager == null)
            reportingManager = new ReportingManagerImpl( this );

        UvmContextFactory.context().servletFileManager().registerDownloadHandler( new EventLogExportDownloadHandler() );
    }

    public void setSettings( final ReportingSettings newSettings )
    {
        this.sanityCheck( newSettings );

        /**
         * Save the settings
         */
        SettingsManager settingsManager = UvmContextFactory.context().settingsManager();
        String nodeID = this.getNodeSettings().getId().toString();
        try {
            settingsManager.save(ReportingSettings.class, System.getProperty("uvm.settings.dir") + "/" + "untangle-node-reporting/" + "settings_"  + nodeID + ".js", newSettings);
        } catch (SettingsManager.SettingsException e) {
            logger.warn("Failed to save settings.",e);
            return;
        }

        /**
         * Change current settings
         */
        this.settings = newSettings;
        try {logger.debug("New Settings: \n" + new org.json.JSONObject(this.settings).toString(2));} catch (Exception e) {}

        /**
         * Sync settings to disk
         */
        writeCronFile();
        SyslogManagerImpl.reconfigure(this.settings);
    }

    public ReportingSettings getSettings()
    {
        return this.settings;
    }

    public void createSchemas()
    {
        // run commands to create user just in case
        UvmContextFactory.context().execManager().execResult("createuser -U postgres -dSR untangle >/dev/null 2>&1");
        UvmContextFactory.context().execManager().execResult("createdb -O postgres -U postgres uvm >/dev/null 2>&1");
        UvmContextFactory.context().execManager().execResult("createlang -U postgres plpgsql uvm >/dev/null 2>&1");

        synchronized (this) {
            String cmd = REPORTS_SCRIPT + " -c";
            ExecManagerResult result = UvmContextFactory.context().execManager().exec(cmd);
            if (result.getResult() != 0) {
                logger.warn("Failed to create schemas: \"" + cmd + "\" -> "  + result.getResult());
            }
            try {
                String lines[] = result.getOutput().split("\\r?\\n");
                logger.info("Creating Schema: ");
                for ( String line : lines )
                    logger.info("Schema: " + line);
            } catch (Exception e) {}
        }
    }

    public void runDailyReport() throws Exception
    {
        Calendar cal = Calendar.getInstance();
        cal.setTime(new Date()); // now
        cal.add(Calendar.DATE, 1); // tomorrow
        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd");
        String ts = df.format(cal.getTime());

        int exitCode = -1;
        logger.info("Running daily report...");
        boolean tryAgain = false;
        int tries = 0;

        flushEvents();
        
        synchronized (this) {
            do {
                tries++;
                tryAgain = false;
            
                exitCode = UvmContextFactory.context().execManager().execResult(REPORTS_SCRIPT + " -r 1 -m -d " + ts);

                /* exitCode == 1 means another reports process is running, just wait and try again. */
                if (exitCode == 1)  {
                    logger.warn("Report process already running. Waiting and then trying again...");
                    tryAgain = true;
                    Thread.sleep(10000); // sleep 10 seconds
                }
            }
            while (tryAgain && tries < 20); // try max 20 times (20 * 10 seconds = 200 seconds)
        }        
        if (exitCode != 0) {
            if (exitCode == 1) 
                throw new Exception("A reports process is already running. Please try again later.");
            else
                throw new Exception("Unable to create daily reports. (Exit code: " + exitCode + ")");
        }
    }

    public void flushEvents()
    {
        long currentTime  = System.currentTimeMillis();

        if (ReportingNodeImpl.eventWriter != null)
            ReportingNodeImpl.eventWriter.forceFlush();
    }
    
    public void initializeSettings()
    {
        setSettings( initSettings() );
    }

    public String lookupHostname( InetAddress address )
    {
        ReportingSettings settings = this.getSettings();
        if (settings == null)
            return null;
        LinkedList<ReportingHostnameMapEntry> nameMap = settings.getHostnameMap(); 
        if (nameMap == null)
            return null;
        
        for ( ReportingHostnameMapEntry entry : nameMap ) {
            if ( entry.getAddress() != null && entry.getAddress().contains(address))
                return entry.getHostname();
        }
        return null;
    }

    public void logEvent( LogEvent evt )
    {
        ReportingNodeImpl.eventWriter.logEvent( evt );
    }

    public void forceFlush()
    {
        ReportingNodeImpl.eventWriter.forceFlush();
    }

    public double getAvgWriteTimePerEvent()
    {
        return ReportingNodeImpl.eventWriter.getAvgWriteTimePerEvent();
    }

    public long getWriteDelaySec()
    {
        return ReportingNodeImpl.eventWriter.getWriteDelaySec();
    }
    
    public java.sql.ResultSet getEventsResultSet( final String query, final Long policyId, final int limit )
    {
        return ReportingNodeImpl.eventReader.getEventsResultSet( query, policyId, limit );
    }

    public void getEventsResultSetCommit( )
    {
        ReportingNodeImpl.eventReader.getEventsResultSetCommit();
    }
    
    public ArrayList<org.json.JSONObject> getEvents( final String query, final Long policyId, final int limit )
    {
        return ReportingNodeImpl.eventReader.getEvents( query, policyId, limit );
    }

    public Connection getDbConnection()
    {
        try {
            Class.forName("org.postgresql.Driver");
            String url = "jdbc:postgresql://" + settings.getDbHost() + ":" + settings.getDbPort() + "/" + settings.getDbName();
            Properties props = new Properties();
            props.setProperty( "user", settings.getDbUser() );
            props.setProperty( "password", settings.getDbPassword() );
            props.setProperty( "charset", "unicode" );

            return DriverManager.getConnection(url,props);
        }
        catch (Exception e) {
            logger.warn("Failed to connect to DB", e);
            return null;
        }
    }

    public ReportingManager getReportingManager()
    {
        return ReportingNodeImpl.reportingManager;
    }
    
    @Override
    protected PipeSpec[] getPipeSpecs()
    {
        return new PipeSpec[0];
    }

    protected void postInit()
    {
        SettingsManager settingsManager = UvmContextFactory.context().settingsManager();
        String nodeID = this.getNodeSettings().getId().toString();
        ReportingSettings readSettings = null;
        String settingsFileName = System.getProperty("uvm.settings.dir") + "/untangle-node-reporting/" + "settings_" + nodeID + ".js";

        try {
            readSettings = settingsManager.load( ReportingSettings.class, settingsFileName );
        } catch (SettingsManager.SettingsException e) {
            logger.warn("Failed to load settings:",e);
        }
        
        /**
         * If there are still no settings, just initialize
         */
        if (readSettings == null) {
            logger.warn("No settings found - Initializing new settings.");

            this.initializeSettings();
        }
        else {
            logger.info("Loading Settings...");

            this.settings = readSettings;

            logger.debug("Settings: " + this.settings.toJSONString());
        }

        /* intialize schema (if necessary) */
        this.createSchemas();

        /* sync settings to disk if necessary */
        File settingsFile = new File( settingsFileName );
        if (settingsFile.lastModified() > CRON_FILE.lastModified())
            writeCronFile();
        if (settingsFile.lastModified() > SYSLOG_CONF_FILE.lastModified())
            SyslogManagerImpl.reconfigure(this.settings);
        
        /* Start the servlet */
        UvmContextFactory.context().tomcatManager().loadServlet("/reports", "reports");
    }

    protected void preStart()
    {
        if (this.settings == null) {
            postInit();
        }

        ReportingNodeImpl.eventWriter.start();
    }

    protected void postStop()
    {
        ReportingNodeImpl.eventWriter.stop();
    }

    @Override
    protected void preDestroy() 
    {
        UvmContextFactory.context().tomcatManager().unloadServlet("/reports");
    }
    
    private ReportingSettings initSettings()
    {
        ReportingSettings settings = new ReportingSettings();

        return settings;
    }
    
    private void writeCronFile()
    {
        // write the cron file for nightly runs
        String conf = settings.getGenerationMinute() + " " + settings.getGenerationHour() + " " + CRON_STRING;
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

    private void sanityCheck( ReportingSettings settings )
    {
        if ( settings.getReportingUsers() != null) {
            for ( ReportingUser user : settings.getReportingUsers() ) {
                if ( user.getOnlineAccess() ) {
                    if ( user.trans_getPasswordHash() == null )
                        throw new RuntimeException(I18nUtil.marktr("Invalid Settings") + ": \"" + user.getEmailAddress() + "\" " + I18nUtil.marktr("has online access, but no password is set."));
                }
            }
        }
    }

    private class EventLogExportDownloadHandler implements DownloadHandler
    {
        private static final String CHARACTER_ENCODING = "utf-8";

        @Override
        public String getName()
        {
            return "eventLogExport";
        }
        
        public void serveDownload( HttpServletRequest req, HttpServletResponse resp )
        {
            String name = req.getParameter("arg1");
            String query = req.getParameter("arg2");
            String policyIdStr = req.getParameter("arg3");
            String columnListStr = req.getParameter("arg4");

            if (name == null || query == null || policyIdStr == null || columnListStr == null) {
                logger.warn("Invalid parameters: " + name + " , " + query + " , " + policyIdStr + " , " + columnListStr);
                return;
            }

            Long policyId = Long.parseLong(policyIdStr);
            logger.info("Export CSV( name:" + name + " query: " + query + " policyId: " + policyId + " columnList: " + columnListStr + ")");

            ReportingNode reporting = (ReportingNode) UvmContextFactory.context().nodeManager().node("untangle-node-reporting");
            if (reporting == null) {
                logger.warn("reporting node not found");
                return;
            }

            try {
                ResultSet resultSet = reporting.getEventsResultSet( query, policyId, -1 );
        
                // Write content type and also length (determined via byte array).
                resp.setCharacterEncoding(CHARACTER_ENCODING);
                resp.setHeader("Content-Type","text/csv");
                resp.setHeader("Content-Disposition","attachment; filename="+name+".csv");
                // Write the header
                resp.getWriter().write(columnListStr + "\n");
                resp.getWriter().flush();

                if (resultSet == null)
                    return;

                ResultSetMetaData metadata = resultSet.getMetaData();
                int numColumns = metadata.getColumnCount();
                String[] columnList = columnListStr.split(",");

                // Write each row 
                while (resultSet.next()) {
                    // build JSON object from columns
                    int writtenColumnCount = 0;

                    for ( String columnName : columnList ) {
                        Object o = null;
                        try {
                            o = resultSet.getObject( columnName );
                        } catch (Exception e) {
                            // do nothing - object not found
                        }
                        String oStr = "";
                        if (o != null)
                            oStr = o.toString().replaceAll(",","");
                    
                        if (writtenColumnCount != 0)
                            resp.getWriter().write(",");
                        resp.getWriter().write(oStr);
                        writtenColumnCount++;
                    }
                    resp.getWriter().write("\n");
                }
            } catch (Exception e) {
                logger.warn("Failed to export CSV.",e);
            } finally {
                reporting.getEventsResultSetCommit( );
            }
        
        }
    }
    
}