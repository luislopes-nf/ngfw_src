 /**
 * $Id$
 */
package com.untangle.node.smtp;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;

import org.apache.log4j.Logger;

import com.untangle.node.smtp.Response;
import com.untangle.node.smtp.ResponseParser;
import com.untangle.node.smtp.SASLExchangeToken;
import com.untangle.uvm.vnet.ChunkToken;
import com.untangle.uvm.vnet.Token;
import com.untangle.uvm.vnet.ReleaseToken;
import com.untangle.uvm.vnet.NodeTCPSession;
import com.untangle.uvm.vnet.AbstractEventHandler;

public class SmtpServerParserEventHandler extends AbstractEventHandler
{
    protected static final String SHARED_STATE_KEY = "SMTP-shared-state";

    private final Logger logger = Logger.getLogger(SmtpServerParserEventHandler.class);
    
    public SmtpServerParserEventHandler()
    {
        super();
    }

    @Override
    public void handleTCPNewSession( NodeTCPSession session )
    {
        SmtpSharedState serverSideSharedState = new SmtpSharedState();
        session.attach( SHARED_STATE_KEY, serverSideSharedState );
    }

    @Override
    public void handleTCPClientChunk( NodeTCPSession session, ByteBuffer data )
    {
        // grab the SSL Inspector status attachment and release if set to false
        Boolean sslInspectorStatus = (Boolean)session.globalAttachment(NodeTCPSession.KEY_SSL_INSPECTOR_SESSION_INSPECT);

        if ((sslInspectorStatus != null) && (sslInspectorStatus.booleanValue() == false)) {
            session.sendDataToServer(data);
            session.release();
            return;
        }

        logger.warn("Received data when expect object");
        throw new RuntimeException("Received data when expect object");
    }

    @Override
    public void handleTCPServerChunk( NodeTCPSession session, ByteBuffer data )
    {
        // grab the SSL Inspector status attachment and release if set to false
        Boolean sslInspectorStatus = (Boolean)session.globalAttachment(NodeTCPSession.KEY_SSL_INSPECTOR_SESSION_INSPECT);

        if ((sslInspectorStatus != null) && (sslInspectorStatus.booleanValue() == false)) {
            session.sendDataToClient(data);
            session.release();
            return;
        }

        parse( session, data, true, false );
    }

    @Override
    public void handleTCPClientObject( NodeTCPSession session, Object obj )
    {
        // grab the SSL Inspector status attachment and release if set to false
        Boolean sslInspectorStatus = (Boolean)session.globalAttachment(NodeTCPSession.KEY_SSL_INSPECTOR_SESSION_INSPECT);

        if ((sslInspectorStatus != null) && (sslInspectorStatus.booleanValue() == false)) {
            session.release();
            return;
        }

        logger.warn("Received object but expected data.");
        throw new RuntimeException("Received object but expected data.");
    }
    
    @Override
    public void handleTCPServerObject( NodeTCPSession session, Object obj )
    {
        // grab the SSL Inspector status attachment and release if set to false
        Boolean sslInspectorStatus = (Boolean)session.globalAttachment(NodeTCPSession.KEY_SSL_INSPECTOR_SESSION_INSPECT);

        if ((sslInspectorStatus != null) && (sslInspectorStatus.booleanValue() == false)) {
            session.release();
            return;
        }

        logger.warn("Received object but expected data.");
        throw new RuntimeException("Received object but expected data.");
    }
    
    @Override
    public void handleTCPClientDataEnd( NodeTCPSession session, ByteBuffer data )
    {
        if ( data.hasRemaining() ) {
            logger.warn("Received data when expect object");
            throw new RuntimeException("Received data when expect object");
        }
    }

    @Override
    public void handleTCPServerDataEnd( NodeTCPSession session, ByteBuffer data )
    {
        parse( session, data, true, true );
    }

    @Override
    public void handleTCPClientFIN( NodeTCPSession session )
    {
        logger.warn("Received unexpected event.");
        throw new RuntimeException("Received unexpected event.");
    }

    @Override
    public void handleTCPServerFIN( NodeTCPSession session )
    {
        session.shutdownClient();
    }
    
    private void parse( NodeTCPSession session, ByteBuffer data, boolean s2c, boolean last )
    {
        ByteBuffer buf = data;
        ByteBuffer dup = buf.duplicate();
        try {
            if (last) {
                parseEnd( session, buf );
            } else {
                parse( session, buf );
            }
        } catch (Throwable exn) {
            String sessionEndpoints = "[" +
                session.getProtocol() + " : " + 
                session.getClientAddr() + ":" + session.getClientPort() + " -> " +
                session.getServerAddr() + ":" + session.getServerPort() + "]";
                
            session.release();

            if ( s2c ) {
                session.sendObjectToClient( new ReleaseToken() );
                session.sendDataToClient( dup );
            } else {
                session.sendObjectToServer( new ReleaseToken() );
                session.sendDataToServer( dup );
            }
            return;
        }
    }
    
    public void parse( NodeTCPSession session, ByteBuffer buf )
    {
        try {
            if ( isPassthru( session ) ) {
                session.sendObjectToClient( new ChunkToken(buf) );
                return;
            } else {
                doParse( session, buf );
                return;
            }
        } catch ( Exception exn ) {
            session.shutdownClient();
            session.shutdownServer();
            return;
        }
    }

    public final void parseEnd( NodeTCPSession session, ByteBuffer buf )
    {
        if ( buf.hasRemaining() ) {
            session.sendObjectToClient( new ChunkToken(buf) );
            return;
        }
        return;
    }
    
    @SuppressWarnings("fallthrough")
    protected void doParse( NodeTCPSession session, ByteBuffer buf )
    {
        List<Token> toks = new ArrayList<Token>();
        boolean done = false;
        SmtpSharedState serverSideSharedState = (SmtpSharedState) session.attachment( SHARED_STATE_KEY );

        while (buf.hasRemaining() && !done) {

            if ( isPassthru( session ) ) {
                logger.debug("Passthru buffer (" + buf.remaining() + " bytes )");
                toks.add(new ChunkToken(buf));
                for ( Token tok : toks )
                    session.sendObjectToClient( tok );
                return;
            }

            if ( serverSideSharedState.isInSASLLogin() ) {
                logger.debug("In SASL Exchange");
                ByteBuffer dup = buf.duplicate();
                switch ( serverSideSharedState.getSASLObserver().serverData( buf ) ) {
                    case EXCHANGE_COMPLETE:
                        logger.debug("SASL Exchange complete");
                        serverSideSharedState.closeSASLExchange();
                        // fallthrough ?? XXX
                    case IN_PROGRESS:
                        // There should not be any extra bytes
                        // left with "in progress", but what the hell
                        dup.limit(buf.position());
                        toks.add(new SASLExchangeToken(dup));
                        break;
                    case RECOMMEND_PASSTHRU:
                        logger.debug("Entering passthru on advice of SASLObserver");
                        declarePassthru( session );
                        toks.add(PassThruToken.PASSTHRU);
                        toks.add(new ChunkToken(dup.slice()));
                        buf.position(buf.limit());
                        for ( Token tok : toks )
                            session.sendObjectToClient( tok );
                        return;
                }
                continue;
            }

            try {
                ByteBuffer dup = buf.duplicate();
                Response resp = new ResponseParser().parse(dup);
                if (resp != null) {
                    buf.position(dup.position());
                    serverSideSharedState.responseReceived(resp);
                    logger.debug("Received response: " + resp.toDebugString());
                    toks.add(resp);
                } else {
                    done = true;
                    logger.debug("Need more bytes for response");
                }
            } catch (Exception ex) {
                logger.warn("Exception parsing server response", ex);
                declarePassthru( session );
                toks.add( PassThruToken.PASSTHRU );
                toks.add( new ChunkToken(buf) );
                for ( Token tok : toks )
                    session.sendObjectToClient( tok );
                return;
            }
        }

        // Compact the buffer
        buf = compactIfNotEmpty(buf, (1024 * 2));

        if (buf != null) {
            logger.debug("sending " + toks.size() + " tokens and setting a buffer with " + buf.remaining() + " remaining");
        }
        for ( Token tok : toks )
            session.sendObjectToClient( tok );
        session.setServerBuffer( buf );
        return;
    }

    /**
     * Helper which compacts (and possibly expands) the buffer if anything remains. Otherwise, just returns null.
     */
    protected static ByteBuffer compactIfNotEmpty(ByteBuffer buf, int maxSz)
    {
        if (buf.hasRemaining()) {
            buf.compact();
            if (buf.limit() < maxSz) {
                ByteBuffer b = ByteBuffer.allocate(maxSz);
                buf.flip();
                b.put(buf);
                return b;
            }
            return buf;
        } else {
            return null;
        }
    }
    
    /**
     * Is the casing currently in passthru mode
     */
    protected boolean isPassthru( NodeTCPSession session )
    {
        SmtpSharedState sharedState = (SmtpSharedState) session.attachment( SHARED_STATE_KEY );
        return sharedState.passthru;
    }

    /**
     * Called by the unparser to declare that we are now in passthru mode. This is called either because of a parsing
     * error by the caller, or the reciept of a passthru token.
     * 
     */
    protected void declarePassthru( NodeTCPSession session)
    {
        SmtpSharedState sharedState = (SmtpSharedState) session.attachment( SHARED_STATE_KEY );
        sharedState.passthru = true;
    }
    
}
