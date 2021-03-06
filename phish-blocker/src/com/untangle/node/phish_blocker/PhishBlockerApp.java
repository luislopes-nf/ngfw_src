/**
 * $Id$
 */
package com.untangle.node.phish_blocker;

import org.apache.log4j.Logger;

import com.untangle.node.spam_blocker.SpamBlockerBaseApp;
import com.untangle.node.spam_blocker.SpamSettings;
import com.untangle.uvm.DaemonManager;
import com.untangle.uvm.SettingsManager;
import com.untangle.uvm.UvmContextFactory;
import com.untangle.uvm.vnet.Affinity;
import com.untangle.uvm.vnet.Fitting;
import com.untangle.uvm.vnet.PipelineConnector;

public class PhishBlockerApp extends SpamBlockerBaseApp
{
    private final Logger logger = Logger.getLogger(getClass());

    // We want to make sure that phish is before spam,
    // before virus in the pipeline (towards the client for smtp).
    protected final PipelineConnector connector = UvmContextFactory.context().pipelineFoundry().create("phish-smtp", this, null, new PhishBlockerSmtpHandler( this ), Fitting.SMTP_TOKENS, Fitting.SMTP_TOKENS, Affinity.CLIENT, 20, false);
    protected final PipelineConnector[] connectors = new PipelineConnector[] { connector };

    public PhishBlockerApp( com.untangle.uvm.node.NodeSettings nodeSettings, com.untangle.uvm.node.NodeProperties nodeProperties )
    {
        super( nodeSettings, nodeProperties, new PhishBlockerScanner() );
    }

    private void readNodeSettings()
    {
        SettingsManager settingsManager = UvmContextFactory.context().settingsManager();
        String nodeID = this.getNodeSettings().getId().toString();
        String settingsFile = System.getProperty("uvm.settings.dir") + "/untangle-node-phish-blocker/settings_" + nodeID + ".js";
        PhishBlockerSettings readSettings = null;
        
        logger.info("Loading settings from " + settingsFile);
        
        try {
            readSettings =  settingsManager.load( PhishBlockerSettings.class, settingsFile);
        } catch (Exception exn) {
            logger.error("Could not read node settings", exn);
        }

        try {
            if (readSettings == null) {
                logger.warn("No settings found... initializing with defaults");
                initializeSettings();
            }
            else {
                this.spamSettings = readSettings;
            }
        } catch (Exception exn) {
            logger.error("Could not apply node settings", exn);
        }
    }
    
    public PhishBlockerSettings getSettings()
    {
        return (PhishBlockerSettings)super.getSettings();
    }

    public void setSettings(PhishBlockerSettings newSettings)
    {
        logger.info("setSettings()");

        SettingsManager settingsManager = UvmContextFactory.context().settingsManager();
        String nodeID = this.getNodeSettings().getId().toString();
        String settingsFile = System.getProperty("uvm.settings.dir") + "/untangle-node-phish-blocker/settings_" + nodeID + ".js";

        try {
            settingsManager.save( settingsFile, newSettings);
        } catch (Exception exn) {
            logger.error("Could not save Phish Blocker settings", exn);
            return;
        }

        super.setSettings(newSettings);
    }

    public void initializeSettings()
    {
        logger.info("Initializing Settings");

        PhishBlockerSettings tmpSpamSettings = new PhishBlockerSettings();
        configureSpamSettings(tmpSpamSettings);
        tmpSpamSettings.getSmtpConfig().setBlockSuperSpam(false); // no such thing as 'super' phish
        tmpSpamSettings.getSmtpConfig().setAllowTls(true); // allow TLS in phishing by default
        
        setSettings(tmpSpamSettings);
        initSpamDnsblList(tmpSpamSettings);
    }

    @Override
    public boolean isPremium()
    {
        return false;
    }

    @Override
    public String getVendor()
    {
        return "Clam";
    }
    
    @Override
    protected PipelineConnector[] getConnectors()
    {
        return this.connectors;
    }

    @Override
    protected void preInit()
    {
        readNodeSettings();
        SpamSettings ps = getSettings();
        ps.getSmtpConfig().setBlockSuperSpam(false);
        initSpamDnsblList(ps);
    }

    @Override
    protected void preStart( boolean isPermanentTransition )
    {
        UvmContextFactory.context().daemonManager().incrementUsageCount( "clamav-daemon" );
        UvmContextFactory.context().daemonManager().incrementUsageCount( "clamav-freshclam" );
        super.preStart( isPermanentTransition );
    }

    @Override
    protected void postStop( boolean isPermanentTransition )
    {
        UvmContextFactory.context().daemonManager().decrementUsageCount( "clamav-daemon" );
        UvmContextFactory.context().daemonManager().decrementUsageCount( "clamav-freshclam" );
        UvmContextFactory.context().daemonManager().enableDaemonMonitoring("clamav-daemon", 300, "clamd");
        UvmContextFactory.context().daemonManager().enableDaemonMonitoring("clamav-freshclam", 3600, "freshclam");
        super.postStop( isPermanentTransition );
    }
}
