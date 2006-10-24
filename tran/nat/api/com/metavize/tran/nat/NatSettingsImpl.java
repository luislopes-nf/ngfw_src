/*
 * Copyright (c) 2003-2006 Untangle Networks, Inc.
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * Untangle Networks, Inc. ("Confidential Information"). You shall
 * not disclose such Confidential Information.
 *
 * $Id$
 */

package com.metavize.tran.nat;

import java.io.Serializable;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Transient;

import com.metavize.mvvm.NetworkingConfiguration;
import com.metavize.mvvm.networking.BasicNetworkSettings;
import com.metavize.mvvm.networking.DhcpLeaseRule;
import com.metavize.mvvm.networking.DnsStaticHostRule;
import com.metavize.mvvm.networking.NetworkUtil;
import com.metavize.mvvm.networking.RedirectRule;
import com.metavize.mvvm.networking.SetupState;
import com.metavize.mvvm.security.Tid;
import com.metavize.mvvm.tran.HostName;
import com.metavize.mvvm.tran.IPaddr;
import com.metavize.mvvm.tran.Validatable;
import com.metavize.mvvm.tran.ValidateException;
import com.metavize.mvvm.tran.firewall.ip.IPDBMatcher;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.IndexColumn;
import org.hibernate.annotations.Type;

/**
 * Settings for the Nat transform.
 *
 * @author <a href="mailto:rbscott@untanglenetworks.com">Robert Scott</a>
 * @version 1.0
 */
@Entity
@Table(name="tr_nat_settings", schema="settings")
public class NatSettingsImpl implements Validatable, NatSettings, Serializable
{
    private static final long serialVersionUID = 4691775205493112137L;

    private Long id;
    private Tid tid;

    private SetupState setupState = SetupState.BASIC;

    /* Nat Settings */
    private boolean natEnabled = false;
    private IPaddr  natInternalAddress;
    private IPaddr  natInternalSubnet;

    /* DMZ settings */
    private boolean dmzEnabled;
    private IPaddr  dmzAddress;
    private boolean dmzLoggingEnabled = false;

    /* Redirect rules */
    private List<RedirectRule> redirectList = new LinkedList<RedirectRule>();

    /* Is dhcp enabled */
    private boolean dhcpEnabled = false;
    private IPaddr  dhcpStartAddress;
    private IPaddr  dhcpEndAddress;
    private int     dhcpLeaseTime = 0;

    /* Dhcp leasess */
    private List<DhcpLeaseRule> dhcpLeaseList = new LinkedList<DhcpLeaseRule>();

    /* DNS Masquerading settings */
    private boolean  dnsEnabled = false;
    private HostName dnsLocalDomain = HostName.getEmptyHostName();

    /* DNS Static Hosts */
    private List<DnsStaticHostRule> dnsStaticHostList
        = new LinkedList<DnsStaticHostRule>();

    /* Network settings to used in validation for the DHCP settings */
    private BasicNetworkSettings networkSettings;

    private final List localMatcherList;

    private NatSettingsImpl()
    {
        this.localMatcherList = NatUtil.getInstance()
            .getEmptyLocalMatcherList();
    }

    public NatSettingsImpl(Tid tid, SetupState setupState,
                           List localMatcherList)
    {
        this.tid = tid;
        this.setupState = setupState;
        if ( localMatcherList == null ) {
            localMatcherList = NatUtil.getInstance().getEmptyLocalMatcherList();
        }
        this.localMatcherList = Collections.unmodifiableList(localMatcherList);
    }


    public void validate() throws ValidateException
    {
        SettingsValidator.getInstance().validate( this );
    }

    @Id
    @Column(name="settings_id")
    @GeneratedValue
    private Long getId()
    {
        return id;
    }

    private void setId( Long id )
    {
        this.id = id;
    }

    /**
     * Transform id for these settings.
     *
     * @return tid for these settings
     */
    @ManyToOne(fetch=FetchType.EAGER)
    @JoinColumn(name="tid", nullable=false)
    public Tid getTid()
    {
        return tid;
    }

    public void setTid( Tid tid )
    {
        this.tid = tid;
    }

    /**
     * The current setup state for this tranform.  (deprecated,
     * unconfigured, basic, advanced).
     * @return The current setup state for this transform.
     */
    @Column(name="setup_state")
    @Type(type="com.metavize.mvvm.networking.SetupStateUserType")
    public SetupState getSetupState()
    {
        return this.setupState;
    }

    void setSetupState( SetupState newValue )
    {
        this.setupState = newValue;
    }

    /**
     * Get whether or not nat is enabled.
     *
     * @return is NAT is being used.
     */
    @Column(name="nat_enabled", nullable=false)
    public boolean getNatEnabled()
    {
    return natEnabled;
    }

    public void setNatEnabled( boolean enabled )
    {
    natEnabled = enabled;
    }

    /**
     * Get the base of the internal address.
     *
     * @return internal Address.
     */
    @Column(name="nat_internal_addr")
    @Type(type="com.metavize.mvvm.type.IPaddrUserType")
    public IPaddr getNatInternalAddress()
    {
        if (this.natInternalAddress == null) {
            this.natInternalAddress = NetworkUtil.EMPTY_IPADDR;
        }
        return natInternalAddress;
    }

    public void setNatInternalAddress( IPaddr addr )
    {
        if ( addr == null ) addr = NetworkUtil.EMPTY_IPADDR;
        natInternalAddress = addr;
    }

    /**
     * Get the subnet of the internal addresses.
     *
     * @return internal subnet.
     */
    @Column(name="nat_internal_subnet")
    @Type(type="com.metavize.mvvm.type.IPaddrUserType")
    public IPaddr getNatInternalSubnet()
    {
        if (this.natInternalSubnet == null) {
            this.natInternalSubnet = NetworkUtil.EMPTY_IPADDR;
        }
        return natInternalSubnet;
    }

    public void setNatInternalSubnet( IPaddr addr )
    {
        if ( addr == null ) addr = NetworkUtil.EMPTY_IPADDR;
        this.natInternalSubnet = addr;
    }

    /**
     * Get whether or not DMZ is being used.
     *
     * @return is NAT is being used.
     */
    @Column(name="dmz_enabled", nullable=false)
    public boolean getDmzEnabled()
    {
        return dmzEnabled;
    }

    public void setDmzEnabled( boolean enabled )
    {
        dmzEnabled = enabled;
    }

    /**
     * Get whether or not DMZ is being used.
     *
     * @return is NAT is being used.
     */
    @Column(name="dmz_logging_enabled", nullable=false)
    public boolean getDmzLoggingEnabled()
    {
        return this.dmzLoggingEnabled;
    }

    public void setDmzLoggingEnabled( boolean enabled )
    {
        this.dmzLoggingEnabled = enabled;
    }

    /**
     * Get the address of the dmz host
     *
     * @return dmz address.
     */
    @Column(name="dmz_address")
    @Type(type="com.metavize.mvvm.type.IPaddrUserType")
    public IPaddr getDmzAddress()
    {
        return dmzAddress;
    }

    public void setDmzAddress( IPaddr dmzAddress )
    {
        this.dmzAddress = dmzAddress;
    }

    /**
     * List of the redirect rules.
     *
     * @return the list of the redirect rules.
     */
    @OneToMany(fetch=FetchType.EAGER)
    @Cascade({ org.hibernate.annotations.CascadeType.ALL,
            org.hibernate.annotations.CascadeType.DELETE_ORPHAN })
    @JoinTable(name="tr_nat_redirects",
               joinColumns=@JoinColumn(name="setting_id"),
               inverseJoinColumns=@JoinColumn(name="rule_id"))
    @IndexColumn(name="position")
    public List<RedirectRule> getRedirectList()
    {
        return redirectList;
    }

    public void setRedirectList( List<RedirectRule> s )
    {
        redirectList = s;
    }

    @Transient
    public List getGlobalRedirectList()
    {
        return NatUtil.getInstance().getGlobalRedirectList( getRedirectList());
    }

    public void setGlobalRedirectList( List newValue )
    {
        setRedirectList(NatUtil.getInstance().setGlobalRedirectList(getRedirectList(), newValue));
    }

    /* All of the local redirects go at the bottom of the list */
    @Transient
    public List getLocalRedirectList()
    {
        return NatUtil.getInstance().getLocalRedirectList( getRedirectList());
    }

    public void setLocalRedirectList( List newValue )
    {
        setRedirectList(NatUtil.getInstance().setLocalRedirectList(getRedirectList(), newValue));
    }

    /**
     * List of all of the matchers available for local redirects
     */
    @Transient
    public List getLocalMatcherList()
    {
        return this.localMatcherList;
    }

    /**
     * @return If DHCP is enabled.
     */
    @Column(name="dhcp_enabled")
    public boolean getDhcpEnabled()
    {
        return dhcpEnabled;
    }

    public void setDhcpEnabled( boolean b )
    {
        this.dhcpEnabled = b;
    }

    /**
     * Get the start address of the range of addresses to server.
     *
     * @return DHCP start address.
     */
    @Column(name="dhcp_s_address")
    @Type(type="com.metavize.mvvm.type.IPaddrUserType")
    public IPaddr getDhcpStartAddress()
    {
        if (this.dhcpStartAddress == null) {
            this.dhcpStartAddress = NetworkUtil.EMPTY_IPADDR;
        }
        return dhcpStartAddress;
    }

    public void setDhcpStartAddress( IPaddr address )
    {
        if ( address == null ) address = NetworkUtil.EMPTY_IPADDR;
        this.dhcpStartAddress = address;
    }

    /**
     * Get the end address of the range of addresses to server.
     *
     * @return DHCP end address.
     */
    @Column(name="dhcp_e_address")
    @Type(type="com.metavize.mvvm.type.IPaddrUserType")
    public IPaddr getDhcpEndAddress()
    {
        if (this.dhcpEndAddress == null) {
            this.dhcpEndAddress = NetworkUtil.EMPTY_IPADDR;
        }
        return dhcpEndAddress;
    }

    public void setDhcpEndAddress( IPaddr address )
    {
        if ( address == null ) address = NetworkUtil.EMPTY_IPADDR;
        this.dhcpEndAddress = address;
    }

    /** Set the starting and end address of the dns server */
    public void setDhcpStartAndEndAddress( IPaddr start, IPaddr end )
    {
        if ( start == null ) {
            setDhcpStartAddress( end );
            setDhcpEndAddress( end );
        } else if ( end == null )  {
            setDhcpStartAddress( start );
            setDhcpEndAddress( start );
        } else {
            if ( start.isGreaterThan( end )) {
                setDhcpStartAddress( end );
                setDhcpEndAddress( start );
            } else {
                setDhcpStartAddress( start );
                setDhcpEndAddress( end );
            }
        }
    }

    /**
     * Get the default length of the DHCP lease in seconds.
     *
     * @return the length of the DHCP lease in seconds.
     */
    @Column(name="dhcp_lease_time", nullable=false)
    public int getDhcpLeaseTime()
    {
        return this.dhcpLeaseTime;
    }

    public void setDhcpLeaseTime( int time )
    {
        this.dhcpLeaseTime = time;
    }

    /**
     * List of the dhcp leases.
     *
     * @return the list of the dhcp leases.
     */
    @OneToMany(fetch=FetchType.EAGER)
    @Cascade({ org.hibernate.annotations.CascadeType.ALL,
            org.hibernate.annotations.CascadeType.DELETE_ORPHAN })
    @JoinTable(name="tr_dhcp_leases",
               joinColumns=@JoinColumn(name="setting_id"),
               inverseJoinColumns=@JoinColumn(name="rule_id"))
    @IndexColumn(name="position")
    public List<DhcpLeaseRule> getDhcpLeaseList()
    {
        return dhcpLeaseList;
    }

    public void setDhcpLeaseList( List<DhcpLeaseRule> s )
    {
        dhcpLeaseList = s;
    }

    /**
     * @return If DNS Masquerading is enabled.
     */
    @Column(name="dns_enabled", nullable=false)
    public boolean getDnsEnabled()
    {
        return dnsEnabled;
    }

    public void setDnsEnabled( boolean b )
    {
        this.dnsEnabled = b;
    }

    /**
     * Local Domain
     *
     * @return the local domain
     */
    @Column(name="dns_local_domain")
    @Type(type="com.metavize.mvvm.type.HostNameUserType")
    public HostName getDnsLocalDomain()
    {
        if (this.dnsLocalDomain == null) {
            this.dnsLocalDomain = HostName.getEmptyHostName();
        }
        return dnsLocalDomain;
    }

    public void setDnsLocalDomain( HostName s )
    {
        if ( s == null ) s = HostName.getEmptyHostName();
        this.dnsLocalDomain = s;
    }


    /**
     * List of the DNS Static Host rules.
     *
     * @return the list of the DNS Static Host rules.
     */
    @OneToMany(fetch=FetchType.EAGER)
    @Cascade({ org.hibernate.annotations.CascadeType.ALL,
            org.hibernate.annotations.CascadeType.DELETE_ORPHAN })
    @JoinTable(name="tr_nat_dns_hosts",
               joinColumns=@JoinColumn(name="setting_id"),
               inverseJoinColumns=@JoinColumn(name="rule_id"))
    @IndexColumn(name="position")
    public List<DnsStaticHostRule> getDnsStaticHostList()
    {
        return dnsStaticHostList;
    }

    public void setDnsStaticHostList( List<DnsStaticHostRule> s )
    {
        dnsStaticHostList = s;
    }

    /** Methods used to update the current basic network settings object.
     *  this object is only used in validation */
    @Transient
    public BasicNetworkSettings getNetworkSettings()
    {
        return this.networkSettings;
    }

    public void setNetworkSettings( BasicNetworkSettings networkSettings )
    {
        this.networkSettings = networkSettings;
    }
}
