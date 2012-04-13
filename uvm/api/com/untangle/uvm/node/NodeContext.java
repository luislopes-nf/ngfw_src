/*
 * $Id$
 */
package com.untangle.uvm.node;

import java.io.InputStream;
import java.util.List;

import com.untangle.uvm.node.NodeSettings;
import com.untangle.uvm.toolbox.PackageDesc;
import com.untangle.uvm.util.TransactionWork;
import com.untangle.uvm.vnet.VnetSessionDesc;

/**
 * Holds the context for a Node instance.
 */
public interface NodeContext
{
    /**
     * Get the NodeSettings for this instance.
     *
     * @return the node id.
     */
    NodeSettings getNodeSettings();

    /**
     * Get the node for this context.
     *
     * @return this context's node.
     */
    Node node();

    /**
     * Returns the NodeProperties
     *
     * @return the NodeProperties.
     */
    NodeProperties getNodeProperties();

    /**
     * Get the {@link PackageDesc} corresponding to this instance.
     *
     * @return the PackageDesc.
     */
    PackageDesc getPackageDesc();

    /**
     *
     */
    boolean runTransaction(TransactionWork<?> tw);

    InputStream getResourceAsStream(String resource);

    /**
     * <code>resourceExists</code> returns true if the given resources exists
     * for this Node.  False if it does not exist.
     *
     * @param resource a <code>String</code> naming the resource
     * @return a <code>boolean</code> true if the resource exists,
     * false otherwise.
     */
    boolean resourceExists(String resource);

    List<VnetSessionDesc> liveSessionDescs();

    NodeSettings.NodeState getRunState();
}
