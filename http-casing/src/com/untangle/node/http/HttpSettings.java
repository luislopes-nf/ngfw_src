/**
 * $Id$
 */
package com.untangle.node.http;

import java.io.Serializable;

/**
 * Http casing settings.
 *
 */
@SuppressWarnings("serial")
public class HttpSettings implements Serializable
{
    public static final int MIN_URI_LENGTH = 1024;
    public static final int MAX_URI_LENGTH = 4096;

    private boolean enabled = true;
    private boolean nonHttpBlocked = false;
    private boolean blockLongHeaders = false;
    private int maxUriLength = MAX_URI_LENGTH;
    private boolean blockLongUris = false;

    // constructors -----------------------------------------------------------

    public HttpSettings() { }

    // accessors --------------------------------------------------------------

    /**
     * Enabled status for casing.
     *
     * @return true when casing is enabled, false otherwise.
     */
    public boolean isEnabled()
    {
        return enabled;
    }

    public void setEnabled(boolean enabled)
    {
        this.enabled = enabled;
    }

    /**
     * Enables non-http traffic on port 80.
     *
     * @return a <code>boolean</code> value
     */
    public boolean isNonHttpBlocked()
    {
        return nonHttpBlocked;
    }

    public void setNonHttpBlocked(boolean nonHttpBlocked)
    {
        this.nonHttpBlocked = nonHttpBlocked;
    }

    /**
     * Maximum allowable header length.
     *
     * @return maximum characters allowed in a HTTP header.
     */
    public int getMaxHeaderLength()
    {
        return 8192;
    }

    public void setMaxHeaderLength(int maxHeaderLength)
    {
        return;
    }

    /**
     * Enable blocking of headers that exceed maxHeaderLength. If not
     * explicitly blocked the connection is treated as non-HTTP and
     * the behavior is determined by setNonHttpBlocked.
     *
     * @return true if connections containing long headers are blocked.
     */
    public boolean getBlockLongHeaders()
    {
        return blockLongHeaders;
    }

    public void setBlockLongHeaders(boolean blockLongHeaders)
    {
        this.blockLongHeaders = blockLongHeaders;
    }

    /**
     * Maximum allowable URI length.
     *
     * @return maximum characters allowed in the request-line URI.
     */
    public int getMaxUriLength()
    {
        return maxUriLength;
    }

    public void setMaxUriLength(int maxUriLength)
    {
        if (MIN_URI_LENGTH > maxUriLength
            || MAX_URI_LENGTH < maxUriLength) {
            throw new IllegalArgumentException("out of bounds: "
                                               + maxUriLength);
        }
        this.maxUriLength = maxUriLength;
    }

    /**
     * Enable blocking of URIs that exceed maxUriLength. If not
     * explicitly blocked the connection is treated as non-HTTP and
     * the behavior is determined by setNonHttpBlocked.
     *
     * @return true if connections containing long URIs are blocked.
     */
    public boolean getBlockLongUris()
    {
        return blockLongUris;
    }

    public void setBlockLongUris(boolean blockLongUris)
    {
        this.blockLongUris = blockLongUris;
    }
}