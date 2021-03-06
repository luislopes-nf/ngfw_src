/**
 * $Id$
 */
package com.untangle.node.smtp.quarantine;

import java.io.File;

import javax.mail.internet.InternetAddress;

/**
 * Interface for the nodes to insert messages into the quarantine. This is not intended to be "remoted".
 */
public interface QuarantineNodeView
{

    /**
     * Quarantine the given message, destined for the named recipients. <br>
     * <br>
     * Callers should be prepared for the case that after making this call, the underlying File from the MIMEMessage may
     * have been "stolen" (moved).
     * 
     * @param file
     *            the file containing the message to be quarantined
     * @param summary
     *            a summary of the mail
     * @param recipients
     *            any recipients for the mail
     * 
     * @return true if the mail was quarantined.
     */
    public boolean quarantineMail(File file, MailSummary summary, InternetAddress... recipients);

    public String createAuthToken(String account);
}