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

package com.metavize.tran.test;

import java.io.Serializable;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Transient;

import com.metavize.mvvm.security.Tid;
import org.hibernate.annotations.Type;

/**
 * Settings for the Test Transform.
 *
 * @author <a href="mailto:amread@untanglenetworks.com">Aaron Read</a>
 * @version 1.0
 */
@Entity
@Table(name="tr_test_settings", schema="settings")
public class TestSettings implements Serializable
{
    private static final long serialVersionUID = 4143567998376955882L;

    private Long id;
    private Tid tid;
    private Mode mode = Mode.NORMAL;
    // private boolean doubleEnded = true;
    private boolean buffered = true;
    private boolean normal = true;
    private boolean release = true;
    private boolean quiet = false;
    private boolean randomBufferSizes = false;
    private int minRandomBufferSize = 63;
    private int maxRandomBufferSize = 16500;

    public TestSettings () { }

    public TestSettings( Tid tid)
    {
        this.tid = tid;
    }

    public void resetSettings()
    {
        release = false;
        normal = false;
        // doubleEnded = false;
        buffered = false;
    }

    @Id
    @Column(name="id")
    @GeneratedValue
    private Long getId()
    {
        return id;
    }

    private void setId(Long id)
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

    public void setTid(Tid tid)
    {
        this.tid = tid;
    }

    /**
     * Mode to operate in.
     *
     * @return mode.
     */
    @Type(type="com.metavize.tran.test.ModeUserType")
    public Mode getMode()
    {
        return mode;
    }

    public void setMode(Mode mode)
    {
        this.mode = mode;
    }

    /**
     * Buffered?
     *
     * @return true if buffered.
     */
    public boolean isBuffered()
    {
        return buffered;
    }

    public void setBuffered(boolean buffered)
    {
        this.buffered = buffered;
    }

    /**
     * Normal?
     */
    public boolean isNormal()
    {
        return normal;
    }

    public void setNormal(boolean normal)
    {
        this.normal = normal;
    }

    /**
     * Release sessions, true by default.
     *
     * @return true if sessions are released.
     */
    public boolean getRelease()
    {
        return release;
    }

    public void setRelease(boolean release)
    {
        this.release = release;
    }

    /**
     * By default, logs lots of info, quiet suppresses this.
     *
     * @return true
     */
    public boolean isQuiet()
    {
        return quiet;
    }

    public void setQuiet(boolean quiet)
    {
        this.quiet = quiet;
    }

    /**
     * Use random buffer sizes, false by default.
     *
     * @return true for random buffer sizes.
     */
    @Transient
    public boolean getRandomBufferSizes()
    {
        return randomBufferSizes;
    }

    public void setRandomBufferSizes(boolean randomBufferSizes)
    {
        this.randomBufferSizes = randomBufferSizes;
    }

    /**
     * Minimum buffer size when using random buffer sizes. Default is
     * 63.
     *
     * @return minimum buffer size.
     */
    @Column(name="min_random_buffer_size")
    public int getMinRandomBufferSize()
    {
        return minRandomBufferSize;
    }

    public void setMinRandomBufferSize(int minRandomBufferSize)
    {
        this.minRandomBufferSize = minRandomBufferSize;
    }

    /**
     * Maximum buffer size when using random buffer sizes. Default is
     * 16500;
     *
     * @return maximum buffer size.
     */
    @Column(name="max_random_buffer_size")
    public int getMaxRandomBufferSize()
    {
        return maxRandomBufferSize;
    }

    public void setMaxRandomBufferSize(int maxRandomBufferSize)
    {
        this.maxRandomBufferSize = maxRandomBufferSize;
    }
}
