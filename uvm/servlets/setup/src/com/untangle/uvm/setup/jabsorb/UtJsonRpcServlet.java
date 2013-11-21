/**
 * $Id: UtJsonRpcServlet.java 35053 2013-06-17 21:07:03Z dmorris $
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
 */
@SuppressWarnings("serial")
public class UtJsonRpcServlet extends JSONRPCServlet
{
    private static final String BRIDGE_ATTRIBUTE = "SetupJSONRPCBridge";

    private final Logger logger = Logger.getLogger(getClass());

    private InheritableThreadLocal<HttpServletRequest> threadRequest;

    private JSONRPCBridge bridge;
    private UtCallbackController callback;
    
    // HttpServlet methods ----------------------------------------------------

    @SuppressWarnings("unchecked") //getAttribute
    public void init()
    {
        threadRequest = (InheritableThreadLocal<HttpServletRequest>)getServletContext().getAttribute("threadRequest");
        if (null == threadRequest) {
            logger.warn("could not get threadRequest");
        }

        bridge = new JSONRPCBridge();
        callback = new UtCallbackController( bridge );
        bridge.setCallbackController( callback );
        
        try {
            ServletUtils.getInstance().registerSerializers(bridge);
        } catch (Exception e) {
            logger.warn( "Unable to register serializers", e );
        }

        SetupContext sc = SetupContextImpl.makeSetupContext();
        bridge.registerObject("SetupContext", sc, SetupContext.class);
    }

    public void service(HttpServletRequest req, HttpServletResponse resp)
        throws IOException
    {
        if (null != threadRequest) {
            threadRequest.set(req);
        }

        HttpSession s = req.getSession();
        if ( s.getAttribute(BRIDGE_ATTRIBUTE) == null ) {
            s.setAttribute(BRIDGE_ATTRIBUTE, bridge);
        }

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

    public interface SetupContext
    {
        public void setLanguage( String language );
        
        public void setAdminPassword( String password ) throws TransactionRolledbackException;
        
        public void setTimeZone( TimeZone timeZone ) throws TransactionRolledbackException;

        public String getOemName( );

        public String getTimeZones( );
    }
}