package com.untangle.node.ad_blocker.cookies;

@SuppressWarnings("serial")
public class CookieElement implements java.io.Serializable
{
    private String type;
    private String aid;
    private String cid;
    private String pattern;
    private String name;
    private String id;

    public String getType()
    {
        return type;
    }

    public void setType(String type)
    {
        this.type = type;
    }

    public String getAid()
    {
        return aid;
    }

    public void setAid(String aid)
    {
        this.aid = aid;
    }

    public String getCid()
    {
        return cid;
    }

    public void setCid(String cid)
    {
        this.cid = cid;
    }

    public String getPattern()
    {
        return pattern;
    }

    public void setPattern(String pattern)
    {
        this.pattern = pattern;
    }

    public String getName()
    {
        return name;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public String getId()
    {
        return id;
    }

    public void setId(String id)
    {
        this.id = id;
    }

}

// {"type":"ad","aid":"332","cid":"262","pattern":"amgdgt\\.com","name":"Adconion","id":"782"},