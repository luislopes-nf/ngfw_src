/**
 * $Id: LoggingManagerImpl.java 34529 2013-04-11 19:04:52Z dmorris $
 */
package com.untangle.uvm.engine;

import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.BlockingQueue;

import org.apache.log4j.Logger;

import com.untangle.uvm.UvmContextFactory;
import com.untangle.uvm.logging.LoggingManager;
import com.untangle.uvm.logging.LogEvent;

/**
 * Manages event logging.
 */
public class LoggingManagerImpl implements LoggingManager
{
    private final Logger logger = Logger.getLogger(getClass());

    public LoggingManagerImpl() { }

    public void setLoggingNode(Long nodeId)
    {
        UvmRepositorySelector.instance().setLoggingNode( nodeId );
    }

    public void setLoggingUvm()
    {
        UvmRepositorySelector.instance().setLoggingUvm();
    }

    public void resetAllLogs()
    {
        UvmRepositorySelector.instance().reconfigureAll();
    }
}