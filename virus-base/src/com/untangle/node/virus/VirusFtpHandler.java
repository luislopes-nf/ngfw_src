/**
 * $Id$
 */
package com.untangle.node.virus;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.log4j.Logger;

import com.untangle.node.ftp.FtpCommand;
import com.untangle.node.ftp.FtpFunction;
import com.untangle.node.ftp.FtpReply;
import com.untangle.node.ftp.FtpStateMachine;
import com.untangle.node.token.Chunk;
import com.untangle.node.token.EndMarker;
import com.untangle.node.token.FileChunkStreamer;
import com.untangle.node.token.ParseException;
import com.untangle.node.token.Token;
import com.untangle.node.token.TokenException;
import com.untangle.node.token.TokenResult;
import com.untangle.node.token.TokenStreamer;
import com.untangle.node.token.TokenStreamerAdaptor;
import com.untangle.uvm.vnet.NodeSession;
import com.untangle.uvm.vnet.Pipeline;
import com.untangle.uvm.vnet.NodeTCPSession;
import com.untangle.uvm.vnet.event.TCPStreamer;

/**
 * Handler for the FTP protocol.
 */
class VirusFtpHandler extends FtpStateMachine
{
    private final VirusNodeImpl node;
    private final boolean scan;

    private final Logger logger = Logger.getLogger(FtpStateMachine.class);

    private File file;
    private FileChannel inChannel;
    private FileChannel outChannel;
    private boolean c2s;

    /**
     * Map of filenames requested.
     * 
     * Used by ftp virus scanner to know the name of the file being scanned -
     * the name is obtained on the control session and passed to the data
     * session using this map.
     */
    private static final Map<Long, String> fileNamesByCtlSessionId = new ConcurrentHashMap<Long, String>();

    // constructors -----------------------------------------------------------

    VirusFtpHandler(NodeTCPSession session, VirusNodeImpl node) {
        super(session);

        this.node = node;
        this.scan = node.getSettings().getScanFtp();
    }

    // FtpStateMachine methods ------------------------------------------------

    @Override
    protected TokenResult doClientData(Chunk c) throws TokenException
    {
        if (scan) {
            logger.debug("doServerData()");

            if (null == file) {
                logger.debug("creating file for client");
                createFile();
                c2s = true;
            }

            Chunk outChunk = trickle(c.getData());

            return new TokenResult(null, new Token[] { outChunk });
        } else {
            return new TokenResult(null, new Token[] { c });
        }
    }

    @Override
    protected TokenResult doServerData(Chunk c) throws TokenException
    {
        if (scan) {
            logger.debug("doServerData()");

            if (null == file) {
                logger.debug("creating file for server");
                createFile();
                c2s = false;
            }

            Chunk outChunk = trickle(c.getData());

            return new TokenResult(new Token[] { outChunk }, null);
        } else {
            return new TokenResult(new Token[] { c }, null);
        }
    }

    @Override
    protected void doClientDataEnd() throws TokenException
    {
        logger.debug("doClientDataEnd()");

        if (scan && c2s && null != file) {
            try {
                outChannel.close();
            } catch (IOException exn) {
                logger.warn("could not close out channel");
            }

            if (logger.isDebugEnabled()) {
                logger.debug("c2s file: " + file);
            }
            TCPStreamer ts = scan();
            if (null != ts) {
                getSession().beginServerStream(ts);
            }
            file = null;
        } else {
            getSession().shutdownServer();
        }
    }

    @Override
    protected void doServerDataEnd() throws TokenException
    {
        logger.debug("doServerDataEnd()");

        if (scan && !c2s && null != file) {
            try {
                outChannel.close();
            } catch (IOException exn) {
                logger.warn("could not close out channel", exn);
            }

            if (logger.isDebugEnabled()) {
                logger.debug("!c2s file: " + file);
            }
            TCPStreamer ts = scan();
            if (null != ts) {
                getSession().beginClientStream(ts);
            }
            file = null;
        } else {
            getSession().shutdownClient();
        }
    }

    @Override
    protected TokenResult doCommand(FtpCommand command) throws TokenException
    {
        // no longer have a setting for blocking partial fetches
        // it causes too many issues
        // if (FtpFunction.REST == command.getFunction() &&
        // !node.getSettings().getAllowFtpResume()) {
        // FtpReply reply = FtpReply.makeReply(502, "Command not implemented.");
        // return new TokenResult(new Token[] { reply }, null);
        // }

        if (command.getFunction() == FtpFunction.RETR){
            String fileName = command.getArgument();
            addFileName(getSession().getSessionId(), fileName);
        }
        return new TokenResult(null, new Token[] { command });
    }
    
    protected TokenResult doReply(FtpReply reply) throws TokenException
    {
        if (reply.getReplyCode() == FtpReply.PASV || reply.getReplyCode() == FtpReply.EPSV){
            try {
                InetSocketAddress socketAddress = reply.getSocketAddress();
                addDataSocket(socketAddress, getSession().getSessionId());
            } catch (ParseException e) {
                throw new TokenException(e);
            }
        }
        return new TokenResult(new Token[] { reply }, null);
    }

    // private methods --------------------------------------------------------

    private Chunk trickle(ByteBuffer b) throws TokenException
    {
        int l = b.remaining() * node.getTricklePercent() / 100;

        try {
            while (b.hasRemaining()) {
                outChannel.write(b);
            }

            b.clear().limit(l);

            while (b.hasRemaining()) {
                inChannel.read(b);
            }
        } catch (IOException exn) {
            throw new TokenException("could not trickle", exn);
        }

        b.flip();

        return new Chunk(b);
    }

    private TCPStreamer scan() throws TokenException
    {
        VirusScannerResult result;

        try {
            node.incrementScanCount();
            result = node.getScanner().scanFile(file);
        } catch (Exception exn) {
            // Should never happen
            throw new TokenException("could not scan TokenException", exn);
        }

        /* XXX handle the case where result is null */
        String fileName = (String)getSession().globalAttachment(NodeSession.KEY_FTP_FILE_NAME);
        node.logEvent(new VirusFtpEvent(getSession().sessionEvent(), result, node.getName(), fileName));

        if (result.isClean()) {
            node.incrementPassCount();
            Pipeline p = getPipeline();
            TokenStreamer tokSt = new FileChunkStreamer(file, inChannel, null, EndMarker.MARKER, true);
            return new TokenStreamerAdaptor(p, tokSt);
        } else {
            node.incrementBlockCount();
            // Todo: Quarantine (for now, don't delete the file) XXX
            NodeTCPSession s = getSession();
            s.shutdownClient();
            s.shutdownServer();
            return null;
        }
    }

    private void createFile() throws TokenException
    {
        try {
            file = File.createTempFile("VirusFtpHandler-", null);

            FileInputStream fis = new FileInputStream(file);
            inChannel = fis.getChannel();

            FileOutputStream fos = new FileOutputStream(file);
            outChannel = fos.getChannel();

        } catch (IOException exn) {
            throw new TokenException("could not create tmp file");
        }
        
        /**
         * Obtain the sessionId of the control session that opened this data session
         */
        Long ctlSessionId = removeDataSocket(new InetSocketAddress(getSession().getServerAddr(), getSession()
                .getServerPort()));
        if (ctlSessionId == null) {
            ctlSessionId = removeDataSocket(new InetSocketAddress(getSession().getClientAddr(), getSession()
                    .getClientPort()));
        }

        /**
         * Obtain the file name and attach it to the current session
         */
        if (ctlSessionId != null) {
            String fileName = removeFileName(ctlSessionId);
            if (fileName != null)
                getSession().globalAttach(NodeSession.KEY_FTP_FILE_NAME, fileName);
        }

    }

    public static void addFileName(Long ctlSessionId, String fileName)
    {
        fileNamesByCtlSessionId.put(ctlSessionId, fileName);
    }

    public static String removeFileName(Long ctlSessionId)
    {
        if (fileNamesByCtlSessionId.containsKey(ctlSessionId)) {
            return fileNamesByCtlSessionId.remove(ctlSessionId);
        }
        return null;
    }
}