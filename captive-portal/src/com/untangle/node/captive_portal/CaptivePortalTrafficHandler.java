/**
 * $Id$
 */

package com.untangle.node.captive_portal;

import java.net.InetAddress;
import java.nio.ByteBuffer;

import com.untangle.uvm.vnet.TCPNewSessionRequest;
import com.untangle.uvm.vnet.UDPNewSessionRequest;
import com.untangle.uvm.vnet.AbstractEventHandler;
import com.untangle.uvm.vnet.TCPNewSessionRequest;
import com.untangle.uvm.vnet.IPNewSessionRequest;
import com.untangle.uvm.vnet.NodeTCPSession;
import com.untangle.uvm.vnet.NodeUDPSession;
import com.untangle.uvm.vnet.IPPacketHeader;
import com.untangle.uvm.vnet.NodeSession;
import com.untangle.uvm.UvmContextFactory;
import org.apache.log4j.Logger;
import org.apache.log4j.Level;

public class CaptivePortalTrafficHandler extends AbstractEventHandler
{
    private final Logger logger = Logger.getLogger(getClass());
    private CaptivePortalApp node = null;

    public CaptivePortalTrafficHandler( CaptivePortalApp node )
    {
        super(node);
        this.node = node;
    }

    // TCP stuff --------------------------------------------------

    @Override
    public void handleTCPNewSessionRequest( TCPNewSessionRequest sessreq )
    {
        // first we look for and ignore all traffic on port 80 since
        // the http handler will take care of all that
        if (sessreq.getNewServerPort() == 80) {
            sessreq.release();
            return;
        }

        // if the https inspector has attached the session manager then
        // we can allow the traffic since it will come later as http
        if (sessreq.globalAttachment(NodeSession.KEY_SSL_INSPECTOR_SERVER_MANAGER) != null) {
            sessreq.release();
            return;
        }

        // next check is to see if the user is already authenticated
        if (node.isClientAuthenticated(sessreq.getOrigClientAddr()) == true) {
            node.incrementBlinger(CaptivePortalApp.BlingerType.SESSALLOW, 1);
            sessreq.release();
            return;
        }

        // not authenticated so check both of the pass lists
        PassedAddress passed = node.isSessionAllowed(sessreq.getOrigClientAddr(), sessreq.getNewServerAddr());

        if (passed != null) {
            if (passed.getLog() == true) {
                CaptureRuleEvent logevt = new CaptureRuleEvent(sessreq.sessionEvent(), false);
                node.logEvent(logevt);
            }

            node.incrementBlinger(CaptivePortalApp.BlingerType.SESSALLOW, 1);
            sessreq.release();
            return;
        }

        // not authenticated and no pass list match so check the rules
        CaptureRule rule = node.checkCaptureRules(sessreq);

        // by default we allow traffic so if there is no rule pass the traffic
        if (rule == null) {
            node.incrementBlinger(CaptivePortalApp.BlingerType.SESSALLOW, 1);
            sessreq.release();
            return;
        }

        // if we found a pass rule then log and let the traffic pass
        if (rule.getCapture() == false) {
            CaptureRuleEvent logevt = new CaptureRuleEvent(sessreq.sessionEvent(), rule);
            node.logEvent(logevt);

            node.incrementBlinger(CaptivePortalApp.BlingerType.SESSALLOW, 1);
            sessreq.release();
            return;
        }

        // the traffic needs to be blocked but we have detected SSL traffic
        // so we add a special global attachment that the https handler uses
        // to detect sessions that need https-->http redirection
        if (sessreq.getNewServerPort() == 443) {
            sessreq.globalAttach(NodeSession.KEY_CAPTIVE_PORTAL_REDIRECT, sessreq.getOrigClientAddr());
            sessreq.release();
            return;
        }

        // not yet allowed and we found a block rule so shut it down
        CaptureRuleEvent logevt = new CaptureRuleEvent(sessreq.sessionEvent(), rule);
        node.logEvent(logevt);
        node.incrementBlinger(CaptivePortalApp.BlingerType.SESSBLOCK, 1);
        sessreq.rejectReturnRst();
    }

    // UDP stuff --------------------------------------------------

    @Override
    public void handleUDPNewSessionRequest( UDPNewSessionRequest sessreq )
    {
        // first check is to see if the user is already authenticated
        if (node.isClientAuthenticated(sessreq.getOrigClientAddr()) == true) {
            node.incrementBlinger(CaptivePortalApp.BlingerType.SESSALLOW, 1);
            sessreq.release();
            return;
        }

        // not authenticated so check both of the pass lists
        PassedAddress passed = node.isSessionAllowed(sessreq.getOrigClientAddr(), sessreq.getNewServerAddr());

        if (passed != null) {
            if (passed.getLog() == true) {
                CaptureRuleEvent logevt = new CaptureRuleEvent(sessreq.sessionEvent(), false);
                node.logEvent(logevt);
            }

            node.incrementBlinger(CaptivePortalApp.BlingerType.SESSALLOW, 1);
            sessreq.release();
            return;
        }

        // not authenticated and no pass list match so check the rules
        CaptureRule rule = node.checkCaptureRules(sessreq);

        // by default we allow traffic so if there is no rule pass the traffic
        if (rule == null) {
            node.incrementBlinger(CaptivePortalApp.BlingerType.SESSALLOW, 1);
            sessreq.release();
            return;
        }

        // if we found a pass rule then log and let the traffic pass
        if (rule.getCapture() == false) {
            CaptureRuleEvent logevt = new CaptureRuleEvent(sessreq.sessionEvent(), rule);
            node.logEvent(logevt);

            node.incrementBlinger(CaptivePortalApp.BlingerType.SESSALLOW, 1);
            sessreq.release();
            return;
        }

        // traffic not yet allowed so we hook DNS traffic which will
        // allow us to do the lookup ourselves. this will ensure we
        // can't be circumvented by creative UDP port 53 traffic and it
        // will allow HTTP requests to become established which is
        // required for the http-casing to do the redirect
        if (sessreq.getNewServerPort() == 53) {
            // just return here which will cause all subsequent query
            // packets to hit the handleUDPClientPacket method
            return;
        }

        // not yet allowed and we found a block rule and the traffic
        // isn't DNS so shut it down
        CaptureRuleEvent logevt = new CaptureRuleEvent(sessreq.sessionEvent(), rule);
        node.logEvent(logevt);
        node.incrementBlinger(CaptivePortalApp.BlingerType.SESSBLOCK, 1);
        sessreq.rejectSilently();
    }

    @Override
    public void handleUDPClientPacket( NodeUDPSession session, ByteBuffer data, IPPacketHeader header )
    {
        DNSPacket packet = new DNSPacket();
        ByteBuffer response = null;
        InetAddress addr = null;

        // extract the DNS query from the client packet
        packet.ExtractQuery(data.array(), data.limit());
        logger.debug(packet.queryString());

        // this handler will only see UDP packets with a target port
        // of 53 sent from unauthenticated client so if it doesn't seem
        // like a valid DNS A query we build a refused message by
        // passing null to the packet response generator
        if (packet.isValidDNSQuery() != true) {
            node.incrementBlinger(CaptivePortalApp.BlingerType.SESSBLOCK, 1);
            response = packet.GenerateResponse(null);
        }

        // we have a good query for an A record so do the lookup
        else {
            try {
                addr = InetAddress.getByName(packet.getQname());
            }

            // if resolution fails for any reason addr will be null and
            // the response generator will create a servfail message
            catch (Exception e) {
                logger.info("Exception attempting to resolve " + packet.getQname() + " = " + e);
            }

            node.incrementBlinger(CaptivePortalApp.BlingerType.SESSQUERY, 1);
            response = packet.GenerateResponse(addr);
        }

        // send the packet to the client
        session.sendClientPacket( response, header );
        logger.debug(packet.replyString());
    }
}
