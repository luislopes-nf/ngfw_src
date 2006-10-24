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

package com.metavize.mvvm.tran;

import java.awt.Color;
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

import com.metavize.mvvm.security.Tid;
import org.hibernate.annotations.Columns;
import org.hibernate.annotations.Type;

/**
 * Runtime Transform settings.
 *
 * @author <a href="mailto:amread@untanglenetworks.com">Aaron Read</a>
 * @version 1.0
 */
@Entity
@Table(name="transform_preferences")
public class TransformPreferences implements Serializable
{
    private static final long serialVersionUID = 8220361738391151248L;

    private Long id;
    private Tid tid;
    private Color guiBackgroundColor = Color.PINK;
    private String notes;

    // constructors -----------------------------------------------------------

    public TransformPreferences() { }

    public TransformPreferences(Tid tid)
    {
        this.tid = tid;
    }

    // bean methods -----------------------------------------------------------

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
     * Transform id.
     *
     * @return tid for this instance.
     */
    @ManyToOne(fetch=FetchType.EAGER)
    @JoinColumn(name="tid", nullable=false)
    public Tid getTid()
    {
        return tid;
    }

    private void setTid(Tid tid)
    {
        this.tid = tid;
    }

    /**
     * Background color for the GUI panel.
     *
     * @return background color.
     */
    @Columns(columns={
            @Column(name="red"),
            @Column(name="green"),
            @Column(name="blue"),
            @Column(name="alpha")
        })
    @Type(type="com.metavize.mvvm.type.ColorUserType")
    public Color getGuiBackgroundColor()
    {
        return guiBackgroundColor;
    }

    public void setGuiBackgroundColor(Color guiBackgroundColor)
    {
        this.guiBackgroundColor = guiBackgroundColor;
    }
}
