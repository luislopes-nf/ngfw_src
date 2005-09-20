/*
 * Copyright (c) 2004,2005 Metavize Inc.
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * Metavize Inc. ("Confidential Information").  You shall
 * not disclose such Confidential Information.
 *
 * $Id$
 */
package com.metavize.tran.sasl;
import java.nio.ByteBuffer;
import static com.metavize.tran.util.ASCIIUtil.*;


/**
 * Observer for CRAM-MD5 (RFC 2195) mechanism.  Does
 * not find the user's credentials, but serves as a
 * placeholder so we know that this mechanism
 * <b>cannot</b> result in an encrypted channel.
 */
class CRAM_MD5Observer
  extends ClearObserver {

  static final String[] MECH_NAMES = new String[] {
    "CRAM-MD5".toLowerCase()
  };

  CRAM_MD5Observer() {}
}