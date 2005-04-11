/*
 * Copyright (c) 2004, 2005 Metavize Inc.
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * Metavize Inc. ("Confidential Information").  You shall
 * not disclose such Confidential Information.
 *
 *  $Id$
 */

package com.metavize.mvvm.tran.firewall;

import com.metavize.mvvm.tapi.Protocol;

/**
 * The class <code>ProtocolMatcher</code> represents a class for filtering on the Protocol of a
 * session.
 *
 * @author <a href="mailto:rbscott@metavize.com">rbscott</a>
 * @version 1.0
 */
public class ProtocolMatcher
{
    private static final String WILDCARD_MARKER  = "*";
    public static final ProtocolMatcher MATCHER_ALL = new ProtocolMatcher( true, true );
    public static final ProtocolMatcher MATCHER_TCP = new ProtocolMatcher( true, false );
    public static final ProtocolMatcher MATCHER_UDP = new ProtocolMatcher( false, true );
    public static final ProtocolMatcher MATCHER_NIL = new ProtocolMatcher( false, false );

    public final boolean isTcpEnabled;
    public final boolean isUdpEnabled;
    /* XXX ICMP */

    private ProtocolMatcher( boolean tcp, boolean udp ) {
        isTcpEnabled = tcp;
        isUdpEnabled = udp;
    }
    
    public boolean isMatch( Protocol protocol ) {
        if (( protocol == Protocol.TCP )  && isTcpEnabled )
            return true;

        if (( protocol == Protocol.UDP )  && isUdpEnabled )
            return true;

        return false;
    }
}
