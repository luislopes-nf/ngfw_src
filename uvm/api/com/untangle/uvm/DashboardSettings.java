/**
 * $Id: DashboardSettings.java,v 1.00 2015/11/10 14:34:27 dmorris Exp $
 */
package com.untangle.uvm;

import java.io.Serializable;
import java.util.LinkedList;
import java.util.List;

import org.json.JSONObject;
import org.json.JSONString;


/**
 * Dashboard settings.
 */
@SuppressWarnings("serial")
public class DashboardSettings implements Serializable, JSONString
{
    private Integer version;
    
    private List<DashboardWidgetSettings> widgets = new LinkedList<DashboardWidgetSettings>();
    
    public DashboardSettings() { }

    public String toJSONString()
    {
        JSONObject jO = new JSONObject(this);
        return jO.toString();
    }

    public List<DashboardWidgetSettings> getWidgets(){ return widgets; }
    public void setWidgets( List<DashboardWidgetSettings> newValue) { this.widgets = newValue; }

    public Integer getVersion() { return this.version; }
    public void setVersion( Integer newValue ) { this.version = newValue ; }
}
