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

package com.untangle.node.webfilter;

import com.untangle.node.token.TokenHandler;
import com.untangle.node.token.TokenHandlerFactory;
import com.untangle.uvm.vnet.TCPNewSessionRequest;
import com.untangle.uvm.vnet.TCPSession;
import org.apache.log4j.Logger;

/**
 * Factory for creating <code>WebFilterHandler</code>s.
 *
 * @author <a href="mailto:amread@untangle.com">Aaron Read</a>
 * @version 1.0
 */
public class WebFilterFactory implements TokenHandlerFactory
{
    private final Logger logger = Logger.getLogger(getClass());

    private final WebFilterBase node;

    // constructors -----------------------------------------------------------

    WebFilterFactory(WebFilterBase node)
    {
        this.node = node;
    }

    // TokenHandlerFactory methods --------------------------------------------

    public boolean isTokenSession(TCPSession se)
    {
        return true;
    }

    public void handleNewSessionRequest(TCPNewSessionRequest tsr)
    {
    }

    public TokenHandler tokenHandler(TCPSession session)
    {
        return new WebFilterHandler(session, node);
    }
}