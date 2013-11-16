/*
 * $HeadURL: svn://chef/branch/prod/web-ui/work/src/uvm-lib/api/com/untangle/uvm/SkinSettings.java $
 * Copyright (c) 2003-2007 Untangle, Inc.
 *
 * This library is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2,
 * as published by the Free Software Foundation.
 *
 * This library is distributed in the hope that it will be useful, but
 * AS-IS and WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE, TITLE, or
 * NONINFRINGEMENT.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Linking this library statically or dynamically with other modules is
 * making a combined work based on this library.  Thus, the terms and
 * conditions of the GNU General Public License cover the whole combination.
 *
 * As a special exception, the copyright holders of this library give you
 * permission to link this library with independent modules to produce an
 * executable, regardless of the license terms of these independent modules,
 * and to copy and distribute the resulting executable under terms of your
 * choice, provided that you also meet, for each linked independent module,
 * the terms and conditions of the license of that module.  An independent
 * module is a module which is not derived from or based on this library.
 * If you modify this library, you may extend this exception to your version
 * of the library, but you are not obligated to do so.  If you do not wish
 * to do so, delete this exception statement from your version.
 */
package com.untangle.uvm;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;

/**
 * Uvm skin settings.
 *
 * @author <a href="mailto:cmatei@untangle.com">Catalin Matei</a>
 * @version 1.0
 */
@Entity
@Table(name="u_skin_settings", schema="settings")
public class SkinSettings implements Serializable{
    private Long id;
    private String administrationClientSkin = "default";
    private String userPagesSkin  = "default";
    private boolean outOfDate = false;

    public SkinSettings() { }

    @Id
    @Column(name="skin_settings_id")
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
     * Get the skin used in the administration client
     *
     * @return skin name.
     */
    @Column(name="admin_skin")
	public String getAdministrationClientSkin() {
		return administrationClientSkin;
	}

	public void setAdministrationClientSkin(String administrationClientSkin) {
		this.administrationClientSkin = administrationClientSkin;
	}

    /**
     * Get the skin used in the user pages like quarantine and block pages.
     *
     * @return skin name.
     */
    @Column(name="user_skin")
	public String getUserPagesSkin() {
		return userPagesSkin;
	}

	public void setUserPagesSkin(String userPagesSkin) {
		this.userPagesSkin = userPagesSkin;
	}

    public void copy(SkinSettings settings) {
        settings.setAdministrationClientSkin(this.administrationClientSkin);
        settings.setUserPagesSkin(this.userPagesSkin);
    }

    @Transient
    public boolean getOutOfDate() {
        return this.outOfDate;
    }
    public void setOutOfDate(boolean outOfDate) {
        this.outOfDate = outOfDate;
    }

}