/**
 * $Id$
 */
package com.untangle.uvm.network;

import java.io.Serializable;
import java.util.LinkedList;
import java.util.List;
import java.net.InetAddress;

import org.json.JSONObject;
import org.json.JSONString;

/**
 * QoS settings.
 */
@SuppressWarnings("serial")
public class QosSettings implements Serializable, JSONString
{
    private boolean qosEnabled = false;

    private int defaultPriority = 3;

    private int pingPriority = 1;
    private int dnsPriority = 1;
    private int sshPriority = 1;
    private int openvpnPriority = 1;
    
    private List<QosPriority> qosPriorities = new LinkedList<QosPriority>();

    private List<QosRule> qosRules = new LinkedList<QosRule>();

    public boolean getQosEnabled() { return this.qosEnabled; }
    public void setQosEnabled( boolean newValue ) { this.qosEnabled = newValue; }

    public int getDefaultPriority() { return this.defaultPriority; }
    public void setDefaultPriority( int newValue ) { this.defaultPriority = newValue; }

    public int getPingPriority() { return this.pingPriority; }
    public void setPingPriority( int newValue ) { this.pingPriority = newValue; }

    public int getDnsPriority() { return this.dnsPriority; }
    public void setDnsPriority( int newValue ) { this.dnsPriority = newValue; }

    public int getSshPriority() { return this.sshPriority; }
    public void setSshPriority( int newValue ) { this.sshPriority = newValue; }

    public int getOpenvpnPriority() { return this.openvpnPriority; }
    public void setOpenvpnPriority( int newValue ) { this.openvpnPriority = newValue; }

    public List<QosPriority> getQosPriorities() { return this.qosPriorities; }
    public void setQosPriorities( List<QosPriority> newValue ) { this.qosPriorities = newValue; }

    public List<QosRule> getQosRules() { return this.qosRules; }
    public void setQosRules( List<QosRule> newValue ) { this.qosRules = newValue; }
    
    public String toJSONString()
    {
        JSONObject jO = new JSONObject(this);
        return jO.toString();
    }
}