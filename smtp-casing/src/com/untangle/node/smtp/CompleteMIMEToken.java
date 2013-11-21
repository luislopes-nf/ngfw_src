/**
 * $Id$
 */
package com.untangle.node.smtp;

import java.nio.ByteBuffer;

import javax.mail.internet.MimeMessage;

import org.apache.log4j.Logger;

import com.untangle.node.smtp.mime.MIMETCPStreamer;
import com.untangle.node.token.MetadataToken;
import com.untangle.uvm.vnet.Pipeline;
import com.untangle.uvm.vnet.event.TCPStreamer;

/**
 * Class representing a Complete MIME message. This will be issued if an upstream Node has buffered a complete message.
 */
public class CompleteMIMEToken extends MetadataToken
{

    private static final int CHUNK_SZ = 1024 * 4;

    private final Logger m_logger = Logger.getLogger(CompleteMIMEToken.class);

    private final MimeMessage m_msg;
    private final MessageInfo m_msgInfo;

    public CompleteMIMEToken(MimeMessage msg, MessageInfo msgInfo) {
        m_msg = msg;
        m_msgInfo = msgInfo;
    }

    /**
     * Get the MIMEMessage member of this token
     */
    public MimeMessage getMessage()
    {
        return m_msg;
    }

    /**
     * Get the MessageInfo associated with this email
     */
    public MessageInfo getMessageInfo()
    {
        return m_msgInfo;
    }

    /**
     * Get a TokenStreamer for the contents of this MIME Message (unstuffed)
     * 
     * @param pipeline
     *            the pipeline (needed for the Streamer stuff)
     * 
     * @return the TokenStreamer
     */
    public TCPStreamer toUnstuffedTCPStreamer(Pipeline pipeline, boolean disposeWhenComplete)
    {
        m_logger.debug("About to return a new MIMETCPStreamer");
        return createMIMETCPStreamer(pipeline, disposeWhenComplete);
    }

    /**
     * Get a TokenStreamer for the contents of this MIME Message
     * 
     * @param pipeline
     *            the pipeline (needed for the Streamer stuff)
     * @return the TokenStreamer
     */
    public TCPStreamer toStuffedTCPStreamer(Pipeline pipeline, boolean disposeWhenComplete)
    {
        m_logger.debug("About to return a new StuffingMIMETCPStreamer");
        return new StuffingMIMETCPStreamer(getMessage(), m_msgInfo, pipeline, disposeWhenComplete);
    }

    /**
     * Method for subclasses to create a streamer.
     */
    protected MIMETCPStreamer createMIMETCPStreamer(Pipeline pipeline, boolean disposeWhenComplete)
    {
        return new MIMETCPStreamer(getMessage(), m_msgInfo, pipeline, CHUNK_SZ, disposeWhenComplete);
    }

    private class StuffingMIMETCPStreamer extends MIMETCPStreamer
    {

        private ByteBufferByteStuffer m_bbbs = new ByteBufferByteStuffer();
        private final Logger m_logger = Logger.getLogger(CompleteMIMEToken.StuffingMIMETCPStreamer.class);
        private ByteBuffer m_readBuf = ByteBuffer.allocate(CHUNK_SZ);
        private boolean m_readLast = false;

        StuffingMIMETCPStreamer(MimeMessage msg, MessageInfo messageInfo, final Pipeline pipeline, boolean disposeWhenComplete) {
            super(msg, messageInfo, pipeline, 0, disposeWhenComplete);
            m_logger.debug("Created Complete MIME message streamer (Stuffing)");
        }

        @Override
        protected ByteBuffer createReadBuf()
        {
            return (ByteBuffer) m_readBuf.clear();
        }

        @Override
        public ByteBuffer nextChunk()
        {
            m_logger.debug("Next Chunk called");

            ByteBuffer superRet = super.nextChunk();// This is actualy our "m_readBuf"
            if (superRet != null) {
                ByteBuffer sinkBuf = ByteBuffer.allocate(CHUNK_SZ);
                m_bbbs.transfer(superRet, sinkBuf);
                m_logger.debug("Returning a ByteBuffer of size: " + sinkBuf.remaining());
                return sinkBuf;
            } else {
                if (m_readLast) {
                    return null;
                } else {
                    m_readLast = true;
                    m_logger.debug("No more MIME to read");
                    ByteBuffer toWrap = m_bbbs.getLast(true);
                    m_logger.debug("Final wrapped buffer of size: " + toWrap.remaining());
                    return toWrap;
                }
            }
        }
    }

    public void cleanupTempFile()
    {
        if (m_msgInfo != null && m_msgInfo.getTmpFile() != null) {
            try {
                m_msgInfo.getTmpFile().delete();
            } catch (Exception e) {
                // ignore
            }
        }
    }
}