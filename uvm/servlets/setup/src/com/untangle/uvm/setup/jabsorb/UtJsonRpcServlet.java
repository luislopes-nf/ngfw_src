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

package com.untangle.uvm.setup.jabsorb;

import java.io.IOException;

import java.util.TimeZone;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.transaction.TransactionRolledbackException;

import com.untangle.uvm.servlet.ServletUtils;

import org.apache.log4j.Logger;
import org.jabsorb.JSONRPCBridge;
import org.jabsorb.JSONRPCServlet;

/**
 * Initializes the JSONRPCBridge.
 *
 * @author <a href="mailto:amread@untangle.com">Aaron Read</a>
 * @version 1.0
 */
@SuppressWarnings("serial")
public class UtJsonRpcServlet extends JSONRPCServlet
{
    private static final String BRIDGE_ATTRIBUTE = "SetupJSONRPCBridge";

    private final Logger logger = Logger.getLogger(getClass());

    private InheritableThreadLocal<HttpServletRequest> threadRequest;

    // HttpServlet methods ----------------------------------------------------

    @SuppressWarnings("unchecked") //getAttribute
    public void init()
    {
        threadRequest = (InheritableThreadLocal<HttpServletRequest>)getServletContext().getAttribute("threadRequest");
        if (null == threadRequest) {
            logger.warn("could not get threadRequest");
        }
    }

    public void service(HttpServletRequest req, HttpServletResponse resp)
        throws IOException
    {
        if (null != threadRequest) {
            threadRequest.set(req);
        }

        initSessionBridge(req);

        super.service(req, resp);

        if (null != threadRequest) {
            threadRequest.set(null);
        }
    }

    /**
     * Find the JSONRPCBridge from the current session.
     * If it can't be found in the session, or there is no session,
     * then return the global bridge.
     *
     * @param request The message received
     * @return the JSONRPCBridge to use for this request
     */
    protected JSONRPCBridge findBridge(HttpServletRequest request)
    {
        // Find the JSONRPCBridge for this session or create one
        // if it doesn't exist
        HttpSession session = request.getSession( false );
        JSONRPCBridge jsonBridge = null;
        if (session != null) jsonBridge = (JSONRPCBridge) session.getAttribute( BRIDGE_ATTRIBUTE );

        if ( jsonBridge == null) {
            /* Use the global bridge if it can't find the session bridge. */
            jsonBridge = JSONRPCBridge.getGlobalBridge();
            if ( logger.isDebugEnabled()) logger.debug("Using global bridge.");
        }
        return jsonBridge;
    }

    // private methods --------------------------------------------------------

    private void initSessionBridge(HttpServletRequest req)
    {
        HttpSession s = req.getSession();
        JSONRPCBridge b = (JSONRPCBridge)s.getAttribute(BRIDGE_ATTRIBUTE);

        if (null == b) {
            b = new JSONRPCBridge();
            s.setAttribute(BRIDGE_ATTRIBUTE, b);

            try {
                ServletUtils.getInstance().registerSerializers(b);
            } catch (Exception e) {
                logger.warn( "Unable to register serializers", e );
            }

            b.setCallbackController(new UtCallbackController(b));

            SetupContext sc = SetupContextImpl.makeSetupContext();
            b.registerObject("SetupContext", sc, SetupContext.class);
        }
    }

    public interface SetupContext
    {
        public void setLanguage( String language );
        
        public void setAdminPassword( String password ) throws TransactionRolledbackException;
        
        public void setTimeZone( TimeZone timeZone ) throws TransactionRolledbackException;

        public String getOemName( );

        public void refreshNetworkConfig();
    }
}
