/*
 * $Id$
 */
package com.untangle.uvm;

import java.util.Date;
import java.util.LinkedList;
import java.util.List;

import org.apache.log4j.Logger;

import com.untangle.uvm.node.License;
import com.untangle.uvm.node.LicenseManager;
import com.untangle.uvm.util.I18nUtil;

public class DefaultLicenseManagerImpl implements LicenseManager
{
    private final Logger logger = Logger.getLogger(getClass());

    private final List<License> licenses = new LinkedList<License>();
    
    DefaultLicenseManagerImpl() {}

    /**
     * Reload all of the available licenses
     */
    public void reloadLicenses( boolean blocking )
    {
        //no-op
        return;
    }

    /**
     * Get the status of a license on a product.
     */
    public boolean isLicenseValid(String identifier)
    {
        if (isGPLApp(identifier))
            return true;
        else
            return false; /* always return false as the real license manager is needed for valid licenses */
    }

    /**
     * Get the status of a license on a product.
     */
    public License getLicense(String identifier)
    {
        if (isGPLApp(identifier))
            return null;
        
        /**
         * This returns an invalid license for all requests
         * Note: this includes the free apps, however they don't actually check the license so it won't effect behavior
         * The UI will request the license of all app (including free)
         */
        logger.info("License Manager is not loaded. Returing invalid license for " + identifier + ".");
        return new License(identifier, "0000-0000-0000-0000", identifier, "Subscription", 0, 0, "invalid", 1, Boolean.FALSE, I18nUtil.marktr("No License Found"));
    }

    public List<License> getLicenses()
    {
        return this.licenses;
    }

    public void requestTrialLicense( String nodeName ) throws Exception
    {
        return;
    }
    
    public boolean hasPremiumLicense()
    {
        return false;
    }

    public int validLicenseCount()
    {
        return 0;
    }
    
    public int getSeatLimit()
    {
        return -1;
    }

    public int getSeatLimit( boolean lienency )
    {
        return -1;
    }
    
    private boolean isGPLApp(String identifier)
    {
        if ("untangle-node-ad-blocker".equals(identifier)) return true;
        else if ("untangle-node-virus-blocker-lite".equals(identifier)) return true;
        else if ("untangle-node-captive-portal".equals(identifier)) return true;
        else if ("untangle-node-firewall".equals(identifier)) return true;
        else if ("untangle-node-intrusion-prevention".equals(identifier)) return true;
        else if ("untangle-node-openvpn".equals(identifier)) return true;
        else if ("untangle-node-phish-blocker".equals(identifier)) return true;
        else if ("untangle-node-application-control-lite".equals(identifier)) return true;
        else if ("untangle-node-reports".equals(identifier)) return true;
        else if ("untangle-node-router".equals(identifier)) return true;
        else if ("untangle-node-shield".equals(identifier)) return true;
        else if ("untangle-node-spam-blocker-lite".equals(identifier)) return true;
        else if ("untangle-node-web-filter-lite".equals(identifier)) return true;
        else if ("untangle-node-web-monitor".equals(identifier)) return true;

        if ("untangle-node-license".equals(identifier)) return true;
        else if ("untangle-casing-http".equals(identifier)) return true;
        else if ("untangle-casing-ftp".equals(identifier)) return true;
        else if ("untangle-casing-smtp".equals(identifier)) return true;

        return false;
    }

}
