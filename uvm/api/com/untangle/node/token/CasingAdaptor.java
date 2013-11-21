/**
 * $Id: CasingAdaptor.java 34627 2013-05-03 18:30:42Z dmorris $
 */
package com.untangle.node.token;

import java.nio.ByteBuffer;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.log4j.Logger;

import com.untangle.uvm.UvmContextFactory;
import com.untangle.uvm.node.Node;
import com.untangle.uvm.vnet.AbstractEventHandler;
import com.untangle.uvm.vnet.Pipeline;
import com.untangle.uvm.vnet.PipelineFoundry;
import com.untangle.uvm.vnet.NodeSession;
import com.untangle.uvm.vnet.NodeTCPSession;
import com.untangle.uvm.vnet.event.IPDataResult;
import com.untangle.uvm.vnet.event.IPSessionEvent;
import com.untangle.uvm.vnet.event.TCPChunkEvent;
import com.untangle.uvm.vnet.event.TCPChunkResult;
import com.untangle.uvm.vnet.event.TCPSessionEvent;
import com.untangle.uvm.vnet.event.TCPStreamer;

/**
 * Adapts a Token session's underlying byte-stream a <code>Casing</code>.
 */
public class CasingAdaptor extends CasingBase
{
    static final int TOKEN_SIZE = 8;

    public CasingAdaptor(Node node, CasingFactory casingFactory, boolean clientSide, boolean releaseParseExceptions)
    {
        super(node,casingFactory,clientSide,releaseParseExceptions);
    }

    // SessionEventListener methods -------------------------------------------

    @Override
    public void handleTCPNewSession(TCPSessionEvent e)
    {
        NodeTCPSession session = e.session();

        Casing casing = casingFactory.casing( session, clientSide );
        Pipeline pipeline = pipeFoundry.getPipeline( session.id() );

        if (logger.isDebugEnabled()) {
            logger.debug("new session setting: " + pipeline + " for: " + session.id());
        }

        addCasing( session, casing, pipeline );

        if (clientSide) {
            session.serverReadLimit( TOKEN_SIZE );
        } else {
            session.clientReadLimit( TOKEN_SIZE );
        }
    }

    @Override
    public IPDataResult handleTCPClientChunk(TCPChunkEvent e)
    {
        if (logger.isDebugEnabled()) {
            logger.debug("handling client chunk, session: " + e.session().id());
        }

        if (clientSide) {
            return parse(e, false, false);
        } else {
            return unparse(e, false);
        }
    }

    @Override
    public IPDataResult handleTCPServerChunk(TCPChunkEvent e)
    {
        if (logger.isDebugEnabled()) {
            logger.debug("handling server chunk, session: " + e.session().id());
        }

        if (clientSide) {
            return unparse(e, true);
        } else {
            return parse(e, true, false);
        }
    }

    @Override
    public IPDataResult handleTCPClientDataEnd(TCPChunkEvent e)
    {
        if (logger.isDebugEnabled()) {
            logger.debug("handling client chunk, session: " + e.session().id());
        }

        if (clientSide) {
            return parse(e, false, true);
        } else {
            if (e.chunk().hasRemaining()) {
                logger.warn("should not happen: unparse TCPClientDataEnd");
            }
            return null;
        }
    }

    @Override
    public IPDataResult handleTCPServerDataEnd(TCPChunkEvent e)
    {
        if (logger.isDebugEnabled()) {
            logger.debug("handling server chunk, session: " + e.session().id());
        }

        if (clientSide) {
            if (e.chunk().hasRemaining()) {
                logger.warn("should not happen: unparse TCPClientDataEnd");
            }
            return null;
        } else {
            return parse(e, true, true);
        }
    }

    @Override
    public void handleTCPClientFIN(TCPSessionEvent e)
    {
        TCPStreamer tcpStream = null;

        NodeTCPSession s = (NodeTCPSession)e.ipsession();
        Casing c = getCasing(s);

        if (clientSide) {
            TokenStreamer tokSt = c.parser().endSession();
            if (null != tokSt) {
                tcpStream = new TokenStreamerAdaptor(getPipeline(s), tokSt);
            }
        } else {
            tcpStream = c.unparser().endSession();
        }

        if (null != tcpStream) {
            s.beginServerStream(tcpStream);
        } else {
            s.shutdownServer();
        }
    }

    @Override
    public void handleTCPServerFIN(TCPSessionEvent e)
    {
        TCPStreamer ts = null;

        NodeTCPSession s = (NodeTCPSession)e.ipsession();
        Casing c = getCasing(s);

        if (clientSide) {
            ts = c.unparser().endSession();
        } else {
            TokenStreamer tokSt = c.parser().endSession();
            if (null != tokSt) {
                ts = new TokenStreamerAdaptor(getPipeline(s), tokSt);
            }
        }

        if (null != ts) {
            s.beginClientStream(ts);
        } else {
            s.shutdownClient();
        }
    }

    @Override
    public void handleTCPFinalized(TCPSessionEvent e) 
    {
        if (logger.isDebugEnabled()) {
            logger.debug("finalizing " + e.session().id());
        }
        finalize( e.ipsession() );
    }

    @Override
    public void handleTimer(IPSessionEvent e)
    {
        NodeTCPSession s = (NodeTCPSession)e.ipsession();

        Parser p = getCasing(s).parser();
        p.handleTimer();
        // XXX unparser doesnt get one, does it need it?
    }

    // private methods --------------------------------------------------------

    private IPDataResult unparse(TCPChunkEvent e, boolean s2c)
    {
        ByteBuffer b = e.chunk();

        assert b.remaining() <= TOKEN_SIZE;

        if (b.remaining() < TOKEN_SIZE) {
            // read limit 2
            b.compact();
            b.limit(TOKEN_SIZE);
            if (logger.isDebugEnabled()) {
                logger.debug("unparse returning buffer, for more: " + b);
            }
            return new TCPChunkResult(null, null, b);
        }

        NodeTCPSession s = e.session();
        CasingDesc casingDesc = getCasingDesc(s);
        Casing casing = casingDesc.casing;
        Pipeline pipeline = casingDesc.pipeline;

        Long key = new Long(b.getLong());
        Token tok = (Token)pipeline.detach(key);

        if (logger.isDebugEnabled()) {
            logger.debug("RETRIEVED object: " + tok + " with key: " + key
                         + " on pipeline: " + pipeline);
        }

        b.limit(TOKEN_SIZE);

        assert !b.hasRemaining();

        UnparseResult ur;
        try {
            ur = unparseToken(s, casing, tok);
        } catch (Exception exn) { /* not just UnparseException */
            logger.error("internal error, closing connection", exn);
            if (s2c) {
                // XXX We don't have a good handle on this
                s.resetClient();
                s.resetServer();
            } else {
                // XXX We don't have a good handle on this
                s.shutdownServer();
                s.resetClient();
            }
            logger.debug("returning DO_NOT_PASS");

            return IPDataResult.DO_NOT_PASS;
        }

        if (ur.isStreamer()) {
            TCPStreamer ts = ur.getTcpStreamer();
            if (s2c) {
                s.beginClientStream(ts);
            } else {
                s.beginServerStream(ts);
            }
            return new TCPChunkResult(null, null, null);
        } else {
            if (s2c) {
                logger.debug("unparse result to client");
                ByteBuffer[] r = ur.result();
                if (logger.isDebugEnabled()) {
                    for (int i = 0; null != null && i < r.length; i++) {
                        logger.debug("  to client: " + r[i]);
                    }
                }
                return new TCPChunkResult(r, null, null);
            } else {
                logger.debug("unparse result to server");
                ByteBuffer[] r = ur.result();
                if (logger.isDebugEnabled()) {
                    for (int i = 0; null != r && i < r.length; i++) {
                        logger.debug("  to server: " + r[i]);
                    }
                }
                return new TCPChunkResult(null, r, null);
            }
        }
    }

    private UnparseResult unparseToken(NodeTCPSession s, Casing c, Token token)
        throws UnparseException
    {
        Unparser u = c.unparser();

        if (token instanceof Release) {
            Release release = (Release)token;

            finalize( s );
            s.release();

            UnparseResult ur = u.releaseFlush();
            if (ur.isStreamer()) {
                TCPStreamer ts = new ReleaseTcpStreamer
                    (ur.getTcpStreamer(), release);
                return new UnparseResult(ts);
            } else {
                ByteBuffer[] orig = ur.result();
                ByteBuffer[] r = new ByteBuffer[orig.length + 1];
                System.arraycopy(orig, 0, r, 0, orig.length);
                r[r.length - 1] = release.getBytes();
                return new UnparseResult(r);
            }
        } else {
            return u.unparse(token);
        }
    }

    private IPDataResult parse(TCPChunkEvent e, boolean s2c, boolean last)
    {
        NodeTCPSession s = e.session();
        CasingDesc casingDesc = getCasingDesc(s);
        Casing casing = casingDesc.casing;
        Pipeline pipeline = casingDesc.pipeline;

        ParseResult pr;
        ByteBuffer buf = e.chunk();
        ByteBuffer dup = buf.duplicate();
        Parser p = casing.parser();
        try {
            if (last) {
                pr = p.parseEnd(buf);
            } else {
                pr = p.parse(buf);
            }
        } catch (Throwable exn) {
            if (releaseParseExceptions) {
                String sessionEndpoints = "[" +
                    s.getProtocol() + " : " + 
                    s.getClientAddr() + ":" + s.getClientPort() + " -> " +
                    s.getServerAddr() + ":" + s.getServerPort() + "]";

                /**
                 * Some Special handling for semi-common parse exceptions
                 * Otherwise just print the full stack trace
                 *
                 * Parse exception are quite common in the real world as people use non-compliant
                 * or different protocol on standard ports.
                 * As such we don't want to litter the logs too much with these warnings, but we don't want to eliminate
                 * them entirely.
                 *
                 * XXX These are all HTTP based so they should live in the http-casing somewhere
                 */
                String message = exn.getMessage();
                if (message != null && message.contains("no digits found")) {
                    logger.info("Protocol parse exception (no digits found). Releasing session: " + sessionEndpoints);
                } else if (message != null && message.contains("expected")) {
                    logger.info("Protocol parse exception (got != expected). Releasing session: " + sessionEndpoints);
                } else if (message != null && message.contains("data trapped")) {
                    logger.info("Protocol parse exception (data trapped). Releasing session: " + sessionEndpoints);
                } else if (message != null && message.contains("buf limit exceeded")) {
                    logger.info("Protocol parse exception (buf limit exceeded). Releasing session: " + sessionEndpoints);
                } else if (message != null && message.contains("header exceeds")) {
                    logger.info("Protocol parse exception (header exceeds). Releasing session: " + sessionEndpoints);
                } else if (message != null && message.contains("URI length exceeded")) {
                    logger.info("Protocol parse exception (URI length exceeded). Releasing session: " + sessionEndpoints);
                } else {
                    logger.info("Protocol parse exception. releasing session: " + sessionEndpoints, exn);
                }
                
                finalize( s );
                s.release();

                pr = new ParseResult(new Release(dup));
            } else {
                s.shutdownServer();
                s.shutdownClient();
                return IPDataResult.DO_NOT_PASS;
            }
        }

        if (pr.isStreamer()) {
            TokenStreamer tokSt = pr.getTokenStreamer();
            TCPStreamer ts = new TokenStreamerAdaptor(pipeline, tokSt);
            if (s2c) {
                s.beginClientStream(ts);
            } else {
                s.beginServerStream(ts);
            }
            return new TCPChunkResult(null, null, pr.getReadBuffer());
        } else {
            List<Token> results = pr.getResults();

            // XXX add magic:
            ByteBuffer bb = ByteBuffer.allocate(TOKEN_SIZE * results.size());

            // XXX add magic:
            for (Token t : results) {
                Long key = pipeline.attach(t);
                if (logger.isDebugEnabled()) {
                    logger.debug("SAVED object: " + t + " with key: " + key
                                 + " on pipeline: " + pipeline);
                }
                bb.putLong(key);
            }
            bb.flip();

            ByteBuffer[] r = new ByteBuffer[] { bb };

            if (s2c) {
                if (logger.isDebugEnabled()) {
                    logger.debug("parse result to server, read buffer: "
                                 + pr.getReadBuffer()
                                 + "  to client: " + r[0]);
                }
                return new TCPChunkResult(r, null, pr.getReadBuffer());
            } else {
                if (logger.isDebugEnabled()) {
                    logger.debug("parse result to client, read buffer: "
                                 + pr.getReadBuffer()
                                 + "  to server: " + r[0]);
                }
                return new TCPChunkResult(null, r, pr.getReadBuffer());
            }
        }
    }

    private void finalize( NodeSession sess )
    {
        Casing c = getCasing( sess );
        c.parser().handleFinalized();
        c.unparser().handleFinalized();
        removeCasingDesc( sess );
    }
}