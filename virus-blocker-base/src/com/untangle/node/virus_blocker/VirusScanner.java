/**
 * $Id$
 */
package com.untangle.node.virus_blocker;

import java.io.File;
import java.util.Date;
import com.untangle.uvm.vnet.NodeSession;
 
import com.untangle.uvm.node.Scanner;

public interface VirusScanner extends Scanner
{
    /**
     * Scans the file for viruses, producing a virus report.  Note that the contract for this
     * requires that a report always be generated, for any problems or exceptions an
     * "clean" report is generated (and the error/warning should be logged).
     *
     * @param msgFile a <code>File</code> value
     * @return a <code>VirusScannerResult</code> value
     */
    VirusScannerResult scanFile(File msgFile, NodeSession session);

    Date getLastSignatureUpdate();
}
