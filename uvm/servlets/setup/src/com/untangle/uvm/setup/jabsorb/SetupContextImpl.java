/* $HeadURL$ */
package com.untangle.uvm.setup.jabsorb;

import java.util.TimeZone;

import javax.transaction.TransactionRolledbackException;

import org.apache.log4j.Logger;

import com.untangle.uvm.LanguageSettings;
import com.untangle.uvm.LanguageManager;
import com.untangle.uvm.AdminManager;
import com.untangle.uvm.UvmContextFactory;
import com.untangle.uvm.UvmContext;
import com.untangle.uvm.AdminSettings;
import com.untangle.uvm.WizardSettings;
import com.untangle.uvm.AdminUserSettings;
import com.untangle.uvm.util.JsonClient;

import org.json.JSONObject;

public class SetupContextImpl implements UtJsonRpcServlet.SetupContext
{
    private final Logger logger = Logger.getLogger( this.getClass());

    private UvmContext context;

    /* Shamelessly lifted from AdminManagerImpl */
    private static final String INITIAL_USER_NAME = "System Administrator";
    private static final String INITIAL_USER_LOGIN = "admin";

    private SetupContextImpl( UvmContext context )
    {
        this.context = context;
    }

    public void setLanguage( String language )
    {
        LanguageManager lm = this.context.languageManager();
        LanguageSettings ls = lm.getLanguageSettings();
        ls.setLanguage( language );
        lm.setLanguageSettings( ls );
    }
    
    public void setAdminPassword( String password, String email ) throws TransactionRolledbackException
    {
        AdminSettings adminSettings = this.context.adminManager().getSettings();
        AdminUserSettings admin = null;

        /**
         * Find the "admin" user
         */
        for ( AdminUserSettings user : adminSettings.getUsers()) {
            if ( INITIAL_USER_LOGIN.equals( user.getUsername())) {
                admin = user;
                break;
            }
        }

        /**
         * If not found, create it, otherwise just set the existing admin user's password
         */
        if ( admin == null ) {
            admin = new AdminUserSettings( INITIAL_USER_LOGIN, password, INITIAL_USER_NAME, email );
            adminSettings.addUser( admin );
        } else {
            admin.setEmailAddress( email );
            admin.setPassword( password );
        }

        this.context.adminManager().setSettings( adminSettings );
    }

    public WizardSettings getWizardSettings()
    {
        return this.context.getWizardSettings();
    }

    public void setTimeZone( TimeZone timeZone ) throws TransactionRolledbackException
    {
        this.context.adminManager().setTimeZone( timeZone );
    }

    /**
     * This call returns one big JSONObject with references to all the important
     * information This is used to avoid lots of separate synchornous calls via
     * the Setup Wizards UI. Reducing all these seperate calls to initialize the UI
     * reduces startup time
     */
    public org.json.JSONObject getSetupWizardStartupInfo()
    {
        org.json.JSONObject json = new org.json.JSONObject();

        try {
            json.put("skinName", this.context.skinManager().getSettings().getSkinName());
            json.put("timezoneID", this.context.adminManager().getTimeZone().getID());
            json.put("timezones", this.context.adminManager().getTimeZones());
            json.put("oemName", this.context.oemManager().getOemName());
            json.put("fullVersionAndRevision", this.context.adminManager().getFullVersionAndRevision());
            json.put("adminEmail", this.context.adminManager().getAdminEmail());
            json.put("translations", this.context.languageManager().getTranslations("untangle-libuvm"));
            json.put("wizardSettings", this.context.getWizardSettings());
        } catch (Exception e) {
            logger.error("Error generating WebUI startup object", e);
        }
        return json;
    }

    public static UtJsonRpcServlet.SetupContext makeSetupContext()
    {
        UvmContext uvm = UvmContextFactory.context();
        return new SetupContextImpl( uvm );
    }
}
