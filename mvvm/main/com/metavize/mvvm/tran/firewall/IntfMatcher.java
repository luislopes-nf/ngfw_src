/*
 * Copyright (c) 2004, 2005 Metavize Inc.
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * Metavize Inc. ("Confidential Information").  You shall
 * not disclose such Confidential Information.
 *
 *  $Id: IPaddr.java,v 1.5 2005/03/23 04:52:38 rbscott Exp $
 */

package com.metavize.mvvm.tran.firewall;

import com.metavize.mvvm.argon.IntfConverter;

/**
 * The class <code>IntfMatcher</code> represents a class for filtering on one of the interfaces
 * for a session.
 *
 * @author <a href="mailto:rbscott@metavize.com">rbscott</a>
 * @version 1.0
 */
public class IntfMatcher
{
    /* XXX this just won't work at all for three interfaces */
    private static final IntfMatcher MATCHER_ALL = new IntfMatcher( true, true );
    private static final IntfMatcher MATCHER_IN  = new IntfMatcher( true, false );
    private static final IntfMatcher MATCHER_OUT = new IntfMatcher( false, true );
    private static final IntfMatcher MATCHER_NIL = new IntfMatcher( false, false );

    public final boolean isInsideEnabled;
    public final boolean isOutsideEnabled;

    private IntfMatcher( boolean inside, boolean outside ) {
        isInsideEnabled  = inside;
        isOutsideEnabled = outside;
    }
    
    public boolean isMatch( byte intf ) {
        if (( intf == IntfConverter.INSIDE )  && isInsideEnabled )
            return true;

        if (( intf == IntfConverter.OUTSIDE ) && isOutsideEnabled )
            return true;

        return false;
    }
}
