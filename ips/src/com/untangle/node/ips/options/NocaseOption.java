/**
 * $Id$
 */
package com.untangle.node.ips.options;

import org.apache.log4j.Logger;

public class NocaseOption extends IpsOption
{
    private final Logger logger = Logger.getLogger(getClass());

    public NocaseOption(OptionArg arg)
    {
        super(arg);
        String[] parents = new String [] { "ContentOption", "UricontentOption" };
        IpsOption option = signature.getOption(parents, this);
        if(option == null) {
            logger.warn("Unable to find content option to set nocase for sig: " + arg.getRule().getText());
            return;
        }

        if (option instanceof ContentOption) {
            ContentOption content = (ContentOption) option;
            content.setNoCase();
        } else if (option instanceof UricontentOption) {
            UricontentOption uricontent = (UricontentOption) option;
            uricontent.setNoCase();
        }
    }
}