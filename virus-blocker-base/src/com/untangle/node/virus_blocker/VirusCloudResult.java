/*
 * $Id: VirusCloudResult.java 37269 2014-02-26 23:46:16Z dmorris $
 */

package com.untangle.node.virus_blocker;

import java.io.Serializable;
import org.json.JSONObject;
import org.json.JSONString;

@SuppressWarnings("serial")
public class VirusCloudResult implements Serializable, JSONString
{
    String itemCategory = null;
    String itemClass = null;
    String itemHash = null;
    int itemConfidence = 0;

    public String getItemCategory()
    {
        return itemCategory;
    }

    public void setItemCategory(String newValue)
    {
        this.itemCategory = newValue;
    }

    public String getItemClass()
    {
        return itemClass;
    }

    public void setItemClass(String newValue)
    {
        this.itemClass = newValue;
    }

    public int getItemConfidence()
    {
        return itemConfidence;
    }

    public void setItemConfidence(int newValue)
    {
        this.itemConfidence = newValue;
    }

    public String getItemHash()
    {
        return itemHash;
    }

    public void setItemHash(String newValue)
    {
        this.itemHash = newValue;
    }

    public String toJSONString()
    {
        JSONObject jO = new JSONObject(this);
        return jO.toString();
    }

    public String toString()
    {
        return toJSONString();
    }
}
