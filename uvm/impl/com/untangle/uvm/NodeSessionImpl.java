/**
 * $Id$
 */
package com.untangle.uvm;

import java.net.InetAddress;
import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.nio.ByteBuffer;

import org.apache.log4j.Logger;
import org.apache.log4j.MDC;
import org.apache.log4j.helpers.AbsoluteTimeDateFormat;
import static com.untangle.uvm.Dispatcher.SESSION_ID_MDC_KEY;

import com.untangle.uvm.vnet.PipelineConnector;
import com.untangle.uvm.vnet.NodeSession;
import com.untangle.uvm.node.SessionEvent;
import com.untangle.uvm.node.Node;
import com.untangle.uvm.node.NodeSettings;
import com.untangle.uvm.vnet.IPStreamer;
import com.untangle.jnetcap.NetcapSession;
import com.untangle.jvector.Crumb;
import com.untangle.jvector.DataCrumb;
import com.untangle.jvector.ObjectCrumb;
import com.untangle.jvector.ShutdownCrumb;
import com.untangle.jvector.IncomingSocketQueue;
import com.untangle.jvector.OutgoingSocketQueue;
import com.untangle.jvector.SocketQueueListener;
import com.untangle.jvector.Vector;
import com.untangle.jvector.Relay;

import org.apache.log4j.Logger;

/**
 * Abstract base class for all live sessions
 */
public abstract class NodeSessionImpl implements NodeSession
{
    protected Logger logger = Logger.getLogger(NodeSessionImpl.class);

    protected boolean released = false;

    protected final short protocol;

    protected final int clientIntf;
    protected final int serverIntf;

    protected final InetAddress origClientAddr;
    protected final int origClientPort;
    protected final InetAddress origServerAddr;
    protected final int origServerPort;

    protected final InetAddress newClientAddr;
    protected final int newClientPort;
    protected final InetAddress newServerAddr;
    protected final int newServerPort;

    private static DateFormat formatter = new AbsoluteTimeDateFormat();

    protected final Dispatcher dispatcher;

    @SuppressWarnings({"unchecked","rawtypes"}) //generics array creation not supported java6 || java7
    protected final List<Crumb>[] crumbs2write = new ArrayList[] { null, null };

    protected IPStreamer[] streamer = null;

    protected int maxInputSize  = 0;
    protected int maxOutputSize = 0;

    protected final IncomingSocketQueue clientIncomingSocketQueue;
    protected final OutgoingSocketQueue clientOutgoingSocketQueue;

    protected final IncomingSocketQueue serverIncomingSocketQueue;
    protected final OutgoingSocketQueue serverOutgoingSocketQueue;

    protected final SessionGlobalState sessionGlobalState;

    protected boolean isServerShutdown = false;
    protected boolean isClientShutdown = false;

    protected final boolean isVectored;

    protected PipelineConnectorImpl pipelineConnector;

    protected final SessionEvent sessionEvent;

    protected HashMap<String,Object> stringAttachments = new HashMap<String,Object>();
    private static final String NO_KEY_VALUE = "NOKEY";
    
    protected NodeSessionImpl( Dispatcher dispatcher, SessionEvent sessionEvent, IPNewSessionRequestImpl request )
    {
        this.dispatcher = dispatcher;
        this.pipelineConnector = dispatcher.pipelineConnector();
        this.sessionEvent = sessionEvent;
        boolean isVectored = (request.state() == IPNewSessionRequestImpl.REQUESTED || request.state() == IPNewSessionRequestImpl.ENDPOINTED);

        sessionGlobalState        = request.sessionGlobalState();
        pipelineConnector         = request.pipelineConnector();

        if ( isVectored ) {
            this.isVectored           = true;

            clientIncomingSocketQueue = new IncomingSocketQueue( pipelineConnector().node().getNodeSettings().getNodeName() + " client side");
            clientOutgoingSocketQueue = new OutgoingSocketQueue( pipelineConnector().node().getNodeSettings().getNodeName() + " client side");

            serverIncomingSocketQueue = new IncomingSocketQueue( pipelineConnector().node().getNodeSettings().getNodeName() + " server side");
            serverOutgoingSocketQueue = new OutgoingSocketQueue( pipelineConnector().node().getNodeSettings().getNodeName() + " server side");
        } else {
            this.isVectored           = false;

            clientIncomingSocketQueue = null;
            clientOutgoingSocketQueue = null;

            serverIncomingSocketQueue = null;
            serverOutgoingSocketQueue = null;
        }

        this.protocol      = request.getProtocol();

        this.clientIntf    = request.getClientIntf();
        this.serverIntf    = request.getServerIntf();

        this.origClientAddr    = request.getOrigClientAddr();
        this.origClientPort    = request.getOrigClientPort();
        this.newClientAddr    = request.getNewClientAddr();
        this.newClientPort    = request.getNewClientPort();

        this.origServerPort    = request.getOrigServerPort();
        this.origServerAddr    = request.getOrigServerAddr();
        this.newServerPort    = request.getNewServerPort();
        this.newServerAddr    = request.getNewServerAddr();

        if ( isVectored ) {
            SocketQueueListener sqListener = new SessionSocketQueueListener();

            clientIncomingSocketQueue.registerListener( sqListener );
            clientOutgoingSocketQueue.registerListener( sqListener );
            serverIncomingSocketQueue.registerListener( sqListener );
            serverOutgoingSocketQueue.registerListener( sqListener );
        }
    }

    public PipelineConnectorImpl pipelineConnector()
    {
        return pipelineConnector;
    }

    public Object attach(Object ob)
    {
        return attach( NO_KEY_VALUE, ob );
    }

    public Object attachment()
    {
        return attachment( NO_KEY_VALUE );
    }

    public Object attach( String key, Object ob )
    {
        return this.stringAttachments.put( key, ob );
    }

    public Object attachment( String key )
    {
        return this.stringAttachments.get(key);
    }
    
    public Object globalAttach(String key, Object ob)
    {
        return this.sessionGlobalState().attach(key,ob);
    }

    public Object globalAttachment(String key)
    {
        return this.sessionGlobalState().attachment(key);
    }

    public Map<String,Object> getAttachments()
    {
        return this.sessionGlobalState().getAttachments();
    }

    public SessionGlobalState sessionGlobalState()
    {
        return sessionGlobalState;
    }

    public long id()
    {
        return sessionGlobalState.id();
    }

    public long getSessionId()
    {
        return sessionGlobalState.id();
    }

    public NetcapSession netcapSession()
    {
        return sessionGlobalState.netcapSession();
    }

    public boolean isVectored()
    {
        return isVectored;
    }

    public String user()
    {
        return sessionGlobalState.user();
    }

    /**
     * Number of bytes received from the client.
     */
    public long c2tBytes()
    {
        return sessionGlobalState.clientSideListener().getRxBytes();
    }

    /**
     * Number of bytes transmitted to the server.
     */
    public long t2sBytes()
    {
        return sessionGlobalState.serverSideListener().getTxBytes();
    }

    /**
     * Number of bytes received from the server.
     */
    public long s2tBytes()
    {
        return sessionGlobalState.serverSideListener().getRxBytes();
    }

    /**
     * Number of bytes transmitted to the client.
     */
    public long t2cBytes()
    {
        return sessionGlobalState.clientSideListener().getTxBytes();
    }

    /**
     * Number of chunks received from the client.
     */
    public long c2tChunks()
    {
        return sessionGlobalState.clientSideListener().getRxChunks();
    }

    /**
     * Number of chunks transmitted to the server.
     */
    public long t2sChunks()
    {
        return sessionGlobalState.serverSideListener().getTxChunks();
    }

    /**
     * Number of chunks received from the server.
     */
    public long s2tChunks()
    {
        return sessionGlobalState.serverSideListener().getRxChunks();
    }

    /**
     * Number of chunks transmitted to the client.
     */
    public long t2cChunks()
    {
        return sessionGlobalState.clientSideListener().getTxChunks();
    }

    /* These are not really useable without a little bit of tweaking to the vector machine */
    public int maxInputSize()
    {
        return maxInputSize;
    }

    public void maxInputSize( int size )
    {
        /* Possibly throw an error on an invalid size */
        maxInputSize = size;
    }

    public int maxOutputSize()
    {
        return maxOutputSize;
    }

    public void maxOutputSize( int size )
    {
        /* Possibly throw an error on an invalid size */
        maxOutputSize = size;
    }

    /**
     * Shutdown the client side of the connection.
     */
    public void shutdownClient()
    {
        if ( !clientOutgoingSocketQueue.isClosed()) {
            clientOutgoingSocketQueue.write( ShutdownCrumb.getInstance());
        }
    }

    /**
     * Shutdown the server side of the connection.
     */
    public void shutdownServer()
    {
        if ( !serverOutgoingSocketQueue.isClosed()) {
            serverOutgoingSocketQueue.write( ShutdownCrumb.getInstance());
        }
    }

    /**
     * Kill the server and client side of the session, this should only be
     * called from the session thread.
     */
    public void killSession()
    {
        try {
            if ( clientIncomingSocketQueue != null ) clientIncomingSocketQueue.kill();
            if ( clientOutgoingSocketQueue != null ) clientOutgoingSocketQueue.kill();
            if ( serverIncomingSocketQueue != null ) serverIncomingSocketQueue.kill();
            if ( serverOutgoingSocketQueue != null ) serverOutgoingSocketQueue.kill();
        } catch ( Exception ex ) {
            logger.warn( "Error while killing a session", ex );
        }

        try {
            Vector vector = sessionGlobalState.netcapHook().getVector();

            /* Last send the kill signal to the vectoring machine */
            if ( vector != null ) vector.shutdown();
            else logger.info( "kill session called before vectoring started, ignoring vectoring." );
        } catch ( Exception ex ) {
            logger.warn( "Error while killing a session", ex );
        }
    }

    /**
     * Package method to just call the raze method.
     */
    public void raze()
    {
        try {
            UvmContextImpl.getInstance().loggingManager().setLoggingNode( pipelineConnector().node().getNodeSettings().getId() );
            MDC.put(SESSION_ID_MDC_KEY, idForMDC());

            if ( this.clientIncomingSocketQueue != null )
                this.clientIncomingSocketQueue.raze();
            if ( this.serverIncomingSocketQueue != null )
                this.serverIncomingSocketQueue.raze();
            if ( this.clientOutgoingSocketQueue != null )
                this.clientOutgoingSocketQueue.raze();
            if ( this.serverOutgoingSocketQueue != null )
                this.serverOutgoingSocketQueue.raze();

            if (released) {
                logger.debug("raze released");
            } else {
                if (logger.isDebugEnabled()) {
                    IncomingSocketQueue ourcin = clientIncomingSocketQueue();
                    IncomingSocketQueue oursin = serverIncomingSocketQueue();
                    OutgoingSocketQueue ourcout = clientOutgoingSocketQueue();
                    OutgoingSocketQueue oursout = serverOutgoingSocketQueue();
                    logger.debug("raze ourcin: " + ourcin +
                                 ", ourcout: " + ourcout + ", ourcsin: " + oursin + ", oursout: " + oursout +
                                 "  /  crumbs[CLIENT]: " + crumbs2write[CLIENT] + ", crumbs[SERVER]: " + crumbs2write[SERVER]);
                }
            }
            closeFinal();
        } catch (Exception x) {
            String message = "" + x.getClass().getName() + " in raze";
            logger.error(message, x);
        } catch (OutOfMemoryError x) {
            UvmContextImpl.getInstance().fatalError("SessionHandler", x);
        } finally {
            UvmContextImpl.getInstance().loggingManager().setLoggingUvm();
            MDC.remove(SESSION_ID_MDC_KEY);
        }
    }

    /**
     * XXX All this does is remove the session from the netcap agent table, this is being
     * done from the tapi, so it is no longer necessary
     */
    public void shutdownEvent( OutgoingSocketQueue osq )
    {
        logger.debug( "Outgoing socket queue shutdown event: " + osq );

        if ( osq == clientOutgoingSocketQueue ) {
            isClientShutdown = true;
        } else if ( osq == serverOutgoingSocketQueue ) {
            isServerShutdown = true;
        } else {
            logger.error( "Unknown shutdown socket queue: " + osq );
            return;
        }

        /* Remove the session from the netcap agent table */
        if ( isClientShutdown && isServerShutdown ) {
            pipelineConnector.removeSession( this );
        }
    }

    public boolean getServerShutdown() { return this.isServerShutdown; }
    public void setServerShutdown( boolean newValue ) { this.isServerShutdown = newValue; }

    public boolean getClientShutdown() { return this.isClientShutdown; }
    public void setClientShutdown( boolean newValue ) { this.isClientShutdown = newValue; }

    public void shutdownEvent( IncomingSocketQueue isq )
    {
        logger.debug( "Incoming socket queue shutdown event: " + isq );
    }

    public IncomingSocketQueue clientIncomingSocketQueue()
    {
        if ( clientIncomingSocketQueue == null || clientIncomingSocketQueue.isClosed()) return null;
        return clientIncomingSocketQueue;
    }

    public OutgoingSocketQueue clientOutgoingSocketQueue()
    {
        if ( clientOutgoingSocketQueue == null || clientOutgoingSocketQueue.isClosed()) return null;
        return clientOutgoingSocketQueue;
    }

    public IncomingSocketQueue serverIncomingSocketQueue()
    {
        if ( serverIncomingSocketQueue == null || serverIncomingSocketQueue.isClosed()) return null;
        return serverIncomingSocketQueue;
    }

    public OutgoingSocketQueue serverOutgoingSocketQueue()
    {
        if ( serverOutgoingSocketQueue == null || serverOutgoingSocketQueue.isClosed()) return null;
        return serverOutgoingSocketQueue;
    }

    public long getPolicyId()
    {
        return sessionEvent.getPolicyId();
    }

    public SessionEvent sessionEvent()
    {
        return sessionEvent;
    }

    public void release()
    {
        cancelTimer();

        released = true;
        
        Vector vector = sessionGlobalState.netcapHook().getVector();
        if ( vector == null || vector.isRazed() )
            return;
        
        if ( clientIncomingSocketQueue != null &&
             serverOutgoingSocketQueue != null && 
             !clientIncomingSocketQueue.isRazed() &&
             !serverOutgoingSocketQueue.isRazed() ) {

            vector.compress( clientIncomingSocketQueue, serverOutgoingSocketQueue );
        }

        if ( serverIncomingSocketQueue != null &&
             clientOutgoingSocketQueue != null &&
             !serverIncomingSocketQueue.isRazed() &&
             !clientOutgoingSocketQueue.isRazed() ) {

            vector.compress( serverIncomingSocketQueue, clientOutgoingSocketQueue );
        }
    }

    public boolean released()
    {
        return released;
    }

    public void scheduleTimer(long delay)
    {
        if (delay < 0)
            throw new IllegalArgumentException("Delay must be non-negative");
        // mpipe.scheduleTimer(this, delay);
    }

    public void cancelTimer()
    {
        // mpipe.cancelTimer(this);
    }

    public void sendObjectToClient( Object obj )
    {
        sendObject( CLIENT, obj );
    }

    public void sendObjectToServer( Object obj )
    {
        sendObject( SERVER, obj );
    }

    public void sendObject( int side, Object obj )
    {
        if ( obj.getClass().isArray() ) {
            logger.warn("sendObject() called with array. Did you mean sendObjects() instead?", new Exception());
        }

        ObjectCrumb crumb = new ObjectCrumb( obj );
        addCrumb(side, crumb);
    }

    public void sendObjectsToClient( Object[] objs )
    {
        sendObjects( CLIENT, objs );
    }

    public void sendObjectsToServer( Object[] objs )
    {
        sendObjects( SERVER, objs );
    }
    
    public void sendObjects( int side, Object[] objs )
    {
        if ( objs == null || objs.length == 0 )
            return;
        for (int i = 0; i < objs.length; i++)
            sendObject(side, objs[i]);
    }
    
    protected void addCrumb(int side, Crumb buf)
    {
        if (buf == null)
            return;

        OutgoingSocketQueue out;
        if (side == CLIENT)
            out = clientOutgoingSocketQueue();
        else
            out = serverOutgoingSocketQueue();

        if (out == null || out.isClosed()) {
            String sideName = side == CLIENT ? "client" : "server";
            logger.info("Ignoring crumb for dead " + sideName + " outgoing socket queue");
            return;
        }

        List<Crumb> crumbs = crumbs2write[side];

        if (crumbs == null) {
            crumbs = new ArrayList<Crumb>();
            crumbs2write[side] = crumbs;
        }
        crumbs.add(buf);
    }

    protected int sendCrumb(Crumb crumb, OutgoingSocketQueue out)
    {
        int size = 0;
        if (crumb instanceof DataCrumb)
            size = ((DataCrumb)crumb).limit();
        boolean success = out.write(crumb);
        if (logger.isDebugEnabled()) {
            logger.debug("writing " + crumb.type() + " crumb to " + out + ", size: " + size);
        }
        assert success;
        return size;
    }

    protected Crumb getNextCrumb2Send(int side)
    {
        List<Crumb> crumbs = crumbs2write[side];
        assert crumbs != null;
        Crumb result = crumbs.get(0);
        assert result != null;
        // The following no longer applies since data can be null for ICMP packets: (5/05  jdi)
        // assert result.remaining() > 0 : "Cannot send zero length buffer";
        int len = crumbs.size() - 1;
        if (len == 0) {
            // Check if we sent em all, and if so remove the array.
            crumbs2write[side] = null;
        } else {
            crumbs.remove(0);
        }
        return result;
    }
    
    public void complete()
    {
        try {
            UvmContextImpl.getInstance().loggingManager().setLoggingNode(pipelineConnector().node().getNodeSettings().getId());
            MDC.put(SESSION_ID_MDC_KEY, idForMDC());

            sendCompleteEvent();
        } catch (Exception x) {
            String message = "" + x.getClass().getName() + " while completing";
            // logger.error(message, x);
            killSession();
        } catch (OutOfMemoryError x) {
            UvmContextImpl.getInstance().fatalError("SessionHandler", x);
        } finally {
            UvmContextImpl.getInstance().loggingManager().setLoggingUvm();
            MDC.remove(SESSION_ID_MDC_KEY);
        }
    }

    public void clientEvent(IncomingSocketQueue in)
    {
        try {
            UvmContextImpl.getInstance().loggingManager().setLoggingNode(pipelineConnector().node().getNodeSettings().getId());
            readEvent(CLIENT, in);
        } finally {
            UvmContextImpl.getInstance().loggingManager().setLoggingUvm();
        }
    }

    public void serverEvent(IncomingSocketQueue in)
    {
        try {
            UvmContextImpl.getInstance().loggingManager().setLoggingNode(pipelineConnector().node().getNodeSettings().getId());
            readEvent(SERVER, in);
        } finally {
            UvmContextImpl.getInstance().loggingManager().setLoggingUvm();
        }
    }

    public void clientEvent(OutgoingSocketQueue out)
    {
        try {
            UvmContextImpl.getInstance().loggingManager().setLoggingNode(pipelineConnector().node().getNodeSettings().getId());
            writeEvent(CLIENT, out);
        } finally {
            UvmContextImpl.getInstance().loggingManager().setLoggingUvm();
        }
    }

    public void serverEvent(OutgoingSocketQueue out)
    {
        try {
            UvmContextImpl.getInstance().loggingManager().setLoggingNode(pipelineConnector().node().getNodeSettings().getId());
            writeEvent(SERVER, out);
        } finally {
            UvmContextImpl.getInstance().loggingManager().setLoggingUvm();
        }
    }

    /** The write side of the client has been closed from underneath
     * the node, this is the same as an EPIPE, but is delivered
     * as an event */
    public void clientOutputResetEvent(OutgoingSocketQueue out)
    {
        try {
            UvmContextImpl.getInstance().loggingManager().setLoggingNode(pipelineConnector().node().getNodeSettings().getId());
            MDC.put(SESSION_ID_MDC_KEY, idForMDC());

            IncomingSocketQueue in = clientIncomingSocketQueue();
            if (in != null)
                in.reset();
            sideDieing(CLIENT);
        } catch (Exception x) {
            String message = "" + x.getClass().getName() + " while output resetting";
            // logger.error(message, x);
            killSession();
        } catch (OutOfMemoryError x) {
            UvmContextImpl.getInstance().fatalError("SessionHandler", x);
        } finally {
            UvmContextImpl.getInstance().loggingManager().setLoggingUvm();
            MDC.remove(SESSION_ID_MDC_KEY);
        }
    }

    /** The write side of the server has been closed from underneath
     * the node, this is the same as an EPIPE, but is delivered
     * as an event */
    public void serverOutputResetEvent(OutgoingSocketQueue out)
    {
        try {
            UvmContextImpl.getInstance().loggingManager().setLoggingNode(pipelineConnector().node().getNodeSettings().getId());
            MDC.put(SESSION_ID_MDC_KEY, idForMDC());

            IncomingSocketQueue in = serverIncomingSocketQueue();
            if (in != null)
                in.reset();
            sideDieing(SERVER);
        } catch (Exception x) {
            String message = "" + x.getClass().getName() + " while output resetting";
            // logger.error(message, x);
            killSession();
        } catch (OutOfMemoryError x) {
            UvmContextImpl.getInstance().fatalError("SessionHandler", x);
        } finally {
            UvmContextImpl.getInstance().loggingManager().setLoggingUvm();
            MDC.remove(SESSION_ID_MDC_KEY);
        }
    }

    /**
     * <code>clientMark</code> returns the server-side socket mark for this session
     */
    public int  clientMark()
    {
        return this.sessionGlobalState().netcapSession().clientMark();
    }

    /**
     * <code>clientMark</code> sets the server-side socket mark for this session
     */
    public void clientMark(int newmark)
    {
        this.sessionGlobalState().netcapSession().clientMark(newmark);
    }

    /**
     * <code>orClientMark</code> bitwise ORs the provided bitmask with the current client-side conn-mark
     */
    public void orClientMark(int bitmask)
    {
        //java.lang.StringBuilder sb = new java.lang.StringBuilder();
        //java.util.Formatter formatter = new java.util.Formatter(sb, java.util.Locale.US);
        //logger.debug(formatter.format("Set ClientMark to 0x%08x",client_mark).toString()); sb.setLength(0);

        this.sessionGlobalState().netcapSession().orClientMark(bitmask);
    }

    /**
     * <code>setClientQosMark</code> sets the connmark so this session' client-side packets get the provided QoS priority
     */
    public void setClientQosMark(int priority)
    {
        logger.debug("Set Client QosMark to " + priority);
        this.sessionGlobalState().netcapSession().clientQosMark(priority);
    }

    /**
     * <code>serverMark</code> returns the server-side socket mark for this session
     */
    public int  serverMark()
    {
        return this.sessionGlobalState().netcapSession().serverMark();
    }

    /**
     * <code>serverMark</code> sets the server-side socket mark for this session
     */
    public void serverMark(int newmark)
    {
        this.sessionGlobalState().netcapSession().serverMark(newmark);
    }

    /**
     * <code>orServerMark</code> bitwise ORs the provided bitmask with the current server-side conn-mark
     */
    public void orServerMark(int bitmask)
    {
        //java.lang.StringBuilder sb = new java.lang.StringBuilder();
        //java.util.Formatter formatter = new java.util.Formatter(sb, java.util.Locale.US);
        //logger.debug(formatter.format("Set ServerMark to 0x%08x",server_mark).toString()); sb.setLength(0);

        this.sessionGlobalState().netcapSession().orServerMark(bitmask);
    }

    /**
     * <code>setServerQosMark</code> sets the connmark so this session' server-side packets get the provided QoS priority
     */
    public void setServerQosMark(int priority)
    {
        logger.debug("Set Server QosMark to " + priority);
        this.sessionGlobalState().netcapSession().serverQosMark(priority);
    }

    // This is the main write hook called by the Vectoring machine
    public void writeEvent(int side, OutgoingSocketQueue out)
    {
        String sideName = side == CLIENT ? "client" : "server";
        MDC.put(SESSION_ID_MDC_KEY, idForMDC());
        try {
            assert out != null;
            if (!out.isEmpty()) {
                logger.warn("writeEvent to non empty outgoing queue on: " + sideName);
                return;
            }

            IncomingSocketQueue ourin;
            OutgoingSocketQueue ourout, otherout;
            if (side == CLIENT) {
                ourin = serverIncomingSocketQueue();
                ourout = clientOutgoingSocketQueue();
                otherout = serverOutgoingSocketQueue();
            } else {
                ourin = clientIncomingSocketQueue();
                ourout = serverOutgoingSocketQueue();
                otherout = clientOutgoingSocketQueue();
            }
            assert out == ourout;

            if (logger.isDebugEnabled()) {
                logger.debug("write(" + sideName + ") out: " + out +
                             "   /  crumbs, write-queue  " +  crumbs2write[side] + ", " + out.numEvents() +
                             "(" + out.numBytes() + " bytes)" + "   opp-read-queue: " +
                             (ourin == null ? null : ourin.numEvents()));
            }

            if (!doWrite(side, ourout)) {
                sendWritableEvent(side);
                // We have to try more writing here in case we added stuff.
                doWrite(side, ourout);
                doWrite(1 - side, otherout);
            }
            if (streamer == null)
                setupForNormal();
        } catch (Exception x) {
            String message = "" + x.getClass().getName() + " while writing to " + sideName;
            logger.error(message, x);
            killSession();
        } catch (OutOfMemoryError x) {
            UvmContextImpl.getInstance().fatalError("SessionHandler", x);
        } finally {
            MDC.remove(SESSION_ID_MDC_KEY);
        }

    }

    public void readEvent(int side, IncomingSocketQueue in)
    {
        String sideName = side == CLIENT ? "client" : "server";
        MDC.put(SESSION_ID_MDC_KEY, idForMDC());
        try {
            assert in != null;

            // need to check if input contains RST (for TCP) or EXPIRE (for UDP)
            // independent of the write buffers.
            if (isSideDieing(side, in)) {
                sideDieing(side);
                return;
            }

            if (!in.isEnabled()) {
                logger.warn("ignoring readEvent called for disabled side " + side);
                return;
            }
            @SuppressWarnings("unused")
            IncomingSocketQueue ourin, otherin;
            OutgoingSocketQueue ourout, otherout;
            OutgoingSocketQueue cout = clientOutgoingSocketQueue();
            OutgoingSocketQueue sout = serverOutgoingSocketQueue();
            if (side == CLIENT) {
                ourin = clientIncomingSocketQueue();
                otherin = serverIncomingSocketQueue();
                ourout = sout;
                otherout = cout;
            } else {
                ourin = serverIncomingSocketQueue();
                otherin = clientIncomingSocketQueue();
                ourout = cout;
                otherout = sout;
            }
            assert in == ourin;

            if (logger.isDebugEnabled()) {
                logger.debug("read(" + sideName + ") in: " + in +
                             "   /  opp-write-crumbs: " + crumbs2write[1 - side] + ", opp-write-queue: " +
                             (ourout == null ? null : ourout.numEvents()));
            }

            assert streamer == null : "readEvent when streaming";;

            if (ourout == null || (crumbs2write[1 - side] == null && ourout.isEmpty())) {
                handleRead(side, in );
                doWrite(side, otherout);
                doWrite(1 - side, ourout);
                if (streamer != null) {
                    // We do this after the writes so that we try to write out first.
                    setupForStreaming();
                    return;
                }
            } else {
                logger.error("Illegal State: read(" + sideName + ") in: " + in +
                             "   /  opp-write-crumbs: " + crumbs2write[1 - side] + ", opp-write-queue: " +
                             (ourout == null ? null : ourout.numEvents()));
            }
            setupForNormal();
        } catch (Exception x) {
            String message = "" + x.getClass().getName() + " while reading from " + sideName;
            logger.error(message, x);
            killSession();
        } catch (OutOfMemoryError x) {
            UvmContextImpl.getInstance().fatalError("SessionHandler", x);
        } finally {
            MDC.remove(SESSION_ID_MDC_KEY);
        }
    }

    /*
     * the simulateClientData and simulateServerData functions
     * allow injecting data directly at the client and server
     * session endpoints.  They do this by adding the argumented data to the
     * incoming socket queue so that it can be processed exactly as if the data
     * had been received across the network directly from the client or server.
     * These functions were added specifically to allow the client and server
     * sides of the https-casing to pass messages back and forth without the data
     * passing through all the other nodes subscribed to HTTP tokens.
     */
    public void simulateClientData(ByteBuffer data)
    {
        byte local[] = new byte[data.limit()];
        data.get(local,0,data.limit());
        DataCrumb crumb = new DataCrumb(local);
        clientIncomingSocketQueue().send_event(crumb);
    }

    public void simulateServerData(ByteBuffer data)
    {
        byte local[] = new byte[data.limit()];
        data.get(local,0,data.limit());
        DataCrumb crumb = new DataCrumb(data.array(),data.limit());
        serverIncomingSocketQueue().send_event(crumb);
    }

    public short getProtocol() { return protocol; }
    public int getClientIntf() { return clientIntf; }
    public int getServerIntf() { return serverIntf; }

    public InetAddress getOrigClientAddr() { return origClientAddr; }
    public int getOrigClientPort() { return origClientPort; }
    public InetAddress getNewClientAddr() { return newClientAddr; }
    public int getNewClientPort() { return newClientPort; }

    public InetAddress getOrigServerAddr() { return origServerAddr; }
    public int getOrigServerPort() { return origServerPort; }
    public InetAddress getNewServerAddr() { return newServerAddr; }
    public int getNewServerPort() { return newServerPort; }

    public InetAddress getClientAddr() { return origClientAddr; }
    public int getClientPort() { return origClientPort; }
    public InetAddress getServerAddr() { return newServerAddr; }
    public int getServerPort() { return newServerPort; }

    public String toString()
    {
        String origClientAddr = ( getOrigClientAddr() != null ? getOrigClientAddr().getHostAddress() : "null" );
        String newServerAddr = ( getNewServerAddr() != null ? getNewServerAddr().getHostAddress() : "null" );
        return "" +
            "[NodeSession-" + System.identityHashCode(this) + "]" +
            "[Session-" + getSessionId() + "] " +
            getProtocol() + " " +
            origClientAddr + ":" +
            getOrigClientPort() + "->" +
            newServerAddr + ":" +
            getNewServerPort();
    }
    protected void closeFinal()
    {
        cancelTimer();

        dispatcher.removeSession( this );
    }

    /**
     * This one sets up the socket queues for streaming to begin.
     */
    private void setupForStreaming()
    {
        IncomingSocketQueue cin = clientIncomingSocketQueue();
        IncomingSocketQueue sin = serverIncomingSocketQueue();
        OutgoingSocketQueue cout = clientOutgoingSocketQueue();
        OutgoingSocketQueue sout = serverOutgoingSocketQueue();
        assert (streamer != null);

        if (cin != null)
            cin.disable();
        if (sin != null)
            sin.disable();
        if (streamer[CLIENT] != null) {
            if (cout != null)
                cout.enable();
            if (sout != null)
                sout.disable();
        } else {
            if (sout != null)
                sout.enable();
            if (cout != null)
                cout.disable();
        }

        if (logger.isDebugEnabled()) {
            logger.debug("entering streaming mode c: " + streamer[CLIENT] + ", s: " + streamer[SERVER]);
        }
    }

    /**
     * This one sets up the socket queues for normal operation; used
     * when streaming ends.
     */
    private void setupForNormal()
    {
        IncomingSocketQueue cin = clientIncomingSocketQueue();
        IncomingSocketQueue sin = serverIncomingSocketQueue();
        OutgoingSocketQueue cout = clientOutgoingSocketQueue();
        OutgoingSocketQueue sout = serverOutgoingSocketQueue();
        assert (streamer == null);

        // We take care not to change the state unless it's really
        // changing, as changing the state calls notifymvpoll() every
        // time.
        if (sout != null && !sout.isEnabled())
            sout.enable();
        if (sout == null || (sout.isEmpty() && crumbs2write[SERVER] == null)) {
            if (cin != null && !cin.isEnabled())
                cin.enable();
        } else {
            if (cin != null && cin.isEnabled())
                cin.disable();
        }
        if (cout != null && !cout.isEnabled())
            cout.enable();
        if (cout == null || (cout.isEmpty() && crumbs2write[CLIENT] == null)) {
            if (sin != null && !sin.isEnabled())
                sin.enable();
        } else {
            if (sin != null && sin.isEnabled())
                sin.disable();
        }
    }

    /**
     * Returns true if we did something.
     *
     * @param side an <code>int</code> value
     * @param out an <code>OutgoingSocketQueue</code> value
     * @return a <code>boolean</code> value
     */
    private boolean doWrite(int side, OutgoingSocketQueue out)
    {
        boolean didSomething = false;
        if (out != null && out.isEmpty()) {
            if (crumbs2write[side] != null) {
                // Do this first, before checking streamer, so we
                // drain out any remaining buffer.
                tryWrite( side, out );
                didSomething = true;
            } else if (streamer != null) {
                IPStreamer s = streamer[side];
                if (s != null) {
                    // It's the right one.
                    addStreamBuf(side, s);
                    if (crumbs2write[side] != null) {
                        tryWrite( side, out );
                        didSomething = true;
                    }
                }
            }
        }
        return didSomething;
    }

    /**
     * <code>isSideDieing</code> returns true if the incoming socket queue
     * contains an event that will cause the end of the session (at least on
     * that side). These are RST for TCP and EXPIRE for UDP.
     *
     * @param in an <code>IncomingSocketQueue</code> value
     * @return a <code>boolean</code> value
     */
    abstract protected boolean isSideDieing( int side, IncomingSocketQueue in );

    abstract protected void sideDieing( int side ) ;

    abstract protected void sendWritableEvent( int side ) ;

    abstract protected void sendCompleteEvent() ;

    abstract protected void tryWrite( int side, OutgoingSocketQueue out );

    abstract protected void addStreamBuf( int side, IPStreamer streamer );

    abstract protected void handleRead( int side, IncomingSocketQueue in );

    abstract protected String idForMDC();

    private class SessionSocketQueueListener implements SocketQueueListener
    {
        SessionSocketQueueListener() { }

        public void event( IncomingSocketQueue in )
        {
            if ( in == serverIncomingSocketQueue ) {
                if ( logger.isDebugEnabled()) {
                    logger.debug( "IncomingSocketQueueEvent: server - " + in + " " + sessionGlobalState );
                }

                serverEvent( in );
            } else if ( in == clientIncomingSocketQueue ) {
                if ( logger.isDebugEnabled()) {
                    logger.debug( "IncomingSocketQueueEvent: client - " + in + " " + sessionGlobalState );
                }

                clientEvent( in );
            } else {
                /* This should never happen */
                throw new IllegalStateException( "Invalid socket queue: " + in );
            }
        }

        public void event( OutgoingSocketQueue out )
        {
            /**
             * This is called every time a crumb is removed from the
             * outgoing socket queue (what it considers 'writable',
             * but the TAPI defines writable as empty) So, we drop all
             * these writable events unless it is empty. That converts
             * the socketqueue's definition of writable to the TAPI's
             * You are at no risk of spinning because this is only
             * called when something is actually removed from the
             * SocketQueue
             **/
            if (!out.isEmpty())
                return;

            if ( out == serverOutgoingSocketQueue ) {
                if ( logger.isDebugEnabled()) {
                    logger.debug( "OutgoingSocketQueueEvent: server - " + out + " " + sessionGlobalState);
                }

                serverEvent( out );
            } else if ( out == clientOutgoingSocketQueue ) {
                if ( logger.isDebugEnabled()) {
                    logger.debug( "OutgoingSocketQueueEvent: client - " + out + " " + sessionGlobalState);
                }

                clientEvent( out );
            } else {
                /* This should never happen */
                throw new IllegalStateException( "Invalid socket queue: " + out );
            }
        }

        public void shutdownEvent( IncomingSocketQueue in )
        {
            if ( in == serverIncomingSocketQueue ) {
                if ( logger.isDebugEnabled())
                    logger.debug( "ShutdownEvent: server - " + in );
            } else if ( in == clientIncomingSocketQueue ) {
                if ( logger.isDebugEnabled())
                    logger.debug( "ShutdownEvent: client - " + in );
            } else {
                /* This should never happen */
                throw new IllegalStateException( "Invalid socket queue: " + in );
            }
        }

        /** This occurs when the outgoing socket queue is shutdown */
        public void shutdownEvent( OutgoingSocketQueue out )
        {
            boolean isDebugEnabled = logger.isDebugEnabled();
            if ( out == serverOutgoingSocketQueue ) {
                if ( isDebugEnabled ) {
                    logger.debug( "ShutdownEvent: server - " + out + " closed: " + out.isClosed());
                }
                /* If the node hasn't closed the socket queue yet, send the even */
                if ( !out.isClosed()) {
                    /* This is equivalent to an EPIPE */
                    serverOutputResetEvent( out );
                } else {
                    if ( isDebugEnabled ) logger.debug( "shutdown event for closed sink" );
                }
            } else if ( out == clientOutgoingSocketQueue ) {
                if ( isDebugEnabled ) {
                    logger.debug( "ShutdownEvent: client - " + out + " closed: " + out.isClosed());
                }

                if ( !out.isClosed()) {
                    /* This is equivalent to an EPIPE */
                    clientOutputResetEvent( out );
                } else {
                    if ( isDebugEnabled ) logger.debug( "shutdown event for closed sink" );
                }
            } else {
                /* This should never happen */
                throw new IllegalStateException( "Invalid socket queue: " + out );
            }
        }
    }
}