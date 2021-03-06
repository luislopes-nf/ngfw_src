/**
 * $Id$
 */
package com.untangle.uvm.node;

import java.net.InetAddress;
import java.util.ArrayList;

import org.json.JSONObject;

public interface PolicyManager
{
    /**
     * Find the correct policy ID based on the Policy Manager rules for a provided session parameters
     */
    PolicyManagerResult findPolicyId( short protocol, int clientIntf, int serverIntf, InetAddress clientAddr, InetAddress serverAddr, int clientPort, int serverPort );
    
    /**
     * @param child: The node to test if this is a child.
     * @param parent: The node to see the distance from the child to parent.
     * @return.  The number of racks in between the child policy and parent.
     *   This is 0 if child == parent.
     *   This is -1 if child is not a child of parent.
     *   The null rack is a child of every parent.
     *   The null rack is never the parent of any child.
     */
    int getPolicyGenerationDiff( Integer childId, Integer parentId );

    /**
     * Returns the policy ID of the parent for the provided policy ID
     * Or null if the provided policy ID has no parent
     */
    Integer getParentPolicyId( Integer policyId );

    /**
     * Return a list of all current policies Ids and names
     */
    ArrayList<JSONObject> getPoliciesInfo();

    /**
     * Return a list of all available policy IDs
     */
    int[] getPolicyIds();
    
    public class PolicyManagerResult
    {
        public PolicyManagerResult( Integer policyId, Integer policyRuleId )
        {
            this.policyId = policyId;
            this.policyRuleId = policyRuleId;
        }
        
        public Integer policyId;
        public Integer policyRuleId;
    }
}
