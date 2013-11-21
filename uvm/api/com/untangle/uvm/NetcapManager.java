/*
 * $Id: NetcapManager.java 34455 2013-04-02 03:20:19Z dmorris $
 */
package com.untangle.uvm;

import com.untangle.uvm.SessionMatcher;
import com.untangle.uvm.vnet.PipeSpec;

public interface NetcapManager
{    
    /** Get the number of sessions from the SessionTable */
    public int getSessionCount();

    /** Get the number of sessions from the SessionTable */
    public int getSessionCount(short protocol);
    
    /** Shutdown all of the sessions that match <code>matcher</code> */
    public void shutdownMatches( SessionMatcher matcher );
    public void shutdownMatches( SessionMatcher matcher, PipeSpec ps );
    
}