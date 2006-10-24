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

package com.metavize.tran.openvpn;

import java.util.Date;
import javax.persistence.Column;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;

import com.metavize.mvvm.logging.StatisticEvent;
import com.metavize.mvvm.logging.SyslogBuilder;
import com.metavize.mvvm.logging.SyslogPriority;
import javax.persistence.Entity;

/**
 * Log event for a Nat statistics.
 *
 * @author <a href="mailto:rbscott@untanglenetworks.com">Robert Scott</a>
 * @version 1.0
 */
@Entity
@org.hibernate.annotations.Entity(mutable=false)
@Table(name="tr_openvpn_statistic_evt", schema="events")
public class VpnStatisticEvent extends StatisticEvent
{
    private Date start;
    private Date end;

    private long bytesTx = 0;
    private long bytesRx = 0;

    public VpnStatisticEvent() { }

    /**
     * Time the session started.
     *
     * @return time logged.
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="start_time")
    public Date getStart()
    {
        return this.start;
    }

    void setStart( Date start )
    {
        this.start = start;
    }

    /**
     * Time the session ended.
     *
     * @return time logged.
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="end_time")
    public Date getEnd()
    {
        return this.end;
    }

    void setEnd( Date end )
    {
        this.end = end;
    }

    /**
     * Total bytes received during this session.
     *
     * @return time logged.
     */
    @Column(name="rx_bytes", nullable=false)
    public long getBytesRx()
    {
        return this.bytesRx;
    }

    void setBytesRx( long bytesRx )
    {
        this.bytesRx = bytesRx;
    }

    void incrBytesRx( long bytesRx )
    {
        this.bytesRx += bytesRx;
    }

    /**
     * Total transmitted received during this session.
     *
     * @return time logged.
     */
    @Column(name="tx_bytes", nullable=false)
    public long getBytesTx()
    {
        return this.bytesTx;
    }

    void setBytesTx( long bytesTx )
    {
        this.bytesTx = bytesTx;
    }

    void incrBytesTx( long bytesTx )
    {
        this.bytesTx += bytesTx;
    }

    public boolean hasStatistics()
    {
        return ( this.bytesTx > 0 || this.bytesRx > 0 );
    }

    // Syslog methods ---------------------------------------------------------

    // although events are created with no data (see constructor),
    // all data will be set when events are actually and finally logged
    public void appendSyslog(SyslogBuilder sb)
    {
        sb.startSection("info");
        sb.addField("start", getStart());
        sb.addField("end", getEnd());
        sb.addField("bytes-received", getBytesRx());
        sb.addField("bytes-transmitted", getBytesTx());
    }

    @Transient
    public String getSyslogId()
    {
        return "Statistic";
    }

    @Transient
    public SyslogPriority getSyslogPriority()
    {
        return SyslogPriority.INFORMATIONAL; // statistics or normal operation
    }
}
