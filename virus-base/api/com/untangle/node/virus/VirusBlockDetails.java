/*
 * $HeadURL$
 * Copyright (c) 2003-2007 Untangle, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but
 * AS-IS and WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE, TITLE, or
 * NONINFRINGEMENT.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 */

package com.untangle.node.virus;

import java.net.InetAddress;

import com.untangle.node.http.BlockDetails;

/**
 * BlockDetails for Virus.
 *
 * @author <a href="mailto:amread@untangle.com">Aaron Read</a>
 * @version 1.0
 */
public class VirusBlockDetails extends BlockDetails
{
    private final String reason;
    private final String vendor;

    // constructor ------------------------------------------------------------

    public VirusBlockDetails(String host,
                             String uri, String reason,
                             String vendor)
    {
        super(host, uri);
        this.reason = reason;
        this.vendor = vendor;
    }

    // public methods ---------------------------------------------------------
    public String getReason()
    {
        return reason;
    }

    public String getVendor()
    {
        return vendor;
    }
}