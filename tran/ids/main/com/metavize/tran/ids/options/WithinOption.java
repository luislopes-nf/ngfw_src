/*
 * Copyright (c) 2006 Metavize Inc.
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * Metavize Inc. ("Confidential Information").  You shall
 * not disclose such Confidential Information.
 *
 * $Id$
 */

package com.metavize.tran.ids.options;

import com.metavize.tran.ids.IDSRuleSignature;
import org.apache.log4j.Logger;

public class WithinOption extends IDSOption {

    private static final Logger logger = Logger.getLogger(WithinOption.class);

    public WithinOption(IDSRuleSignature signature, String params) {
        super(signature, params);
        int within = Integer.parseInt(params);
        IDSOption option = signature.getOption("ContentOption",this);
        if(option == null) {
            logger.warn("Unable to find content option to set within for sig: " + signature);
            return;
        }

        ContentOption content = (ContentOption) option;
        content.setWithin(within);
    }
}
