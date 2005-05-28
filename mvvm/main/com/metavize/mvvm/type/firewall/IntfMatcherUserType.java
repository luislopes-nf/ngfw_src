/*
 * Copyright (c) 2005 Metavize Inc.
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * Metavize Inc. ("Confidential Information").  You shall
 * not disclose such Confidential Information.
 *
 * $Id$
 */

package com.metavize.mvvm.type.firewall;

import com.metavize.mvvm.type.StringBasedUserType;

import com.metavize.mvvm.tran.firewall.IntfMatcher;

public class IntfMatcherUserType extends StringBasedUserType
{
    public Class returnedClass()
    {
        return IntfMatcher.class;
    }

    protected String userTypeToString( Object v )
    {
        return ((IntfMatcher)v).toString();
    }

    public Object createUserType( String val ) throws Exception
    {
        return IntfMatcher.parse( val );
    }
}
