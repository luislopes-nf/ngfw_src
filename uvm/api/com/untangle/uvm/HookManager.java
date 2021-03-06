/**
 * $Id: HookManager.java,v 1.00 2016/10/28 11:46:12 dmorris Exp $
 */
package com.untangle.uvm;

import java.io.File;

public interface HookManager
{
    public static String NETWORK_SETTINGS_CHANGE = "network-settings-change";
    public static String REPORTS_EVENT_LOGGED = "reports-event-logged";
    public static String LICENSE_CHANGE = "license-change";
    public static String UVM_STARTUP_COMPLETE = "uvm-startup-complete";
    public static String UVM_PRE_UPGRADE = "uvm-pre-upgrade";
    public static String UVM_SETTINGS_CHANGE = "uvm-settings-change";
    public static String HOST_TABLE_REMOVE = "host-table-remove";
    public static String HOST_TABLE_ADD = "host-table-add";
    public static String HOST_TABLE_PENALTY_BOX_ENTER = "host-table-penalty-box-enter";
    public static String HOST_TABLE_PENALTY_BOX_EXIT = "host-table-penalty-box-exit";
    public static String HOST_TABLE_QUOTA_GIVEN = "host-table-quota-given";
    public static String HOST_TABLE_QUOTA_EXCEEDED = "host-table-quota-exceeded";
    public static String HOST_TABLE_QUOTA_REMOVED = "host-table-quota-removed";

    public boolean isRegistered( String hookName, HookCallback callback );

    public boolean registerCallback( String groupName, HookCallback callback );

    public boolean unregisterCallback( String groupName, HookCallback callback );

    public int callCallbacks( String hookName, Object o );
}
