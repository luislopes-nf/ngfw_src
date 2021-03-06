/**
 * $Id$
 */
package com.untangle.node.smtp.quarantine;

import java.net.URLEncoder;

import org.apache.log4j.Logger;

/**
 * Little class used to generate links in digest emails. It exists to be "called" from a Velocity template. <br>
 * <br>
 * Instance is stateful (it "knows" the current address being templated).
 */
public class LinkGenerator
{
    private String m_urlBase;

    private final Logger logger = Logger.getLogger(LinkGenerator.class);
    private static final String AUTH_TOKEN_RP = "tkn";
    
    LinkGenerator(String base, String authTkn) {
        StringBuilder sb = new StringBuilder();
        sb.append("https://");
        sb.append(base);
        sb.append("/quarantine/manageuser?");
        sb.append(AUTH_TOKEN_RP);
        sb.append('=');
        try {
            sb.append(URLEncoder.encode(authTkn, "UTF-8"));
        } catch (java.io.UnsupportedEncodingException e) {
            logger.warn("Unsupported Encoding:", e);
        }

        m_urlBase = sb.toString();
    }

    public String generateInboxLink()
    {
        return m_urlBase;
    }

    public String generateHelpLink()
    {
        return "help_link";
    }

}