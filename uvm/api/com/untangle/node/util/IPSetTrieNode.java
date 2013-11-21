/**
 * $Id$
 */
package com.untangle.node.util;

import java.util.LinkedList;

public class IPSetTrieNode {

    private IPSetTrieNode _0Node = null;
    private IPSetTrieNode _1Node = null;

    private Object  result = null;
    
    public IPSetTrieNode () {}
    
    public IPSetTrieNode (LinkedList<Boolean> bitString, Object result)
    {
        this.add(bitString,result);
    }

    public void add (LinkedList<Boolean> bitString, Object result)
    {
        if (bitString.size() == 0) {
            this.result = result;
            return;
        }

        boolean b = (bitString.removeFirst()).booleanValue();

        if (b) {
            if (_1Node != null)
                _1Node.add(bitString,result);
            else {
                _1Node = new IPSetTrieNode(bitString, result);
            }
        }
        else {
            if (_0Node != null)
                _0Node.add(bitString,result);
            else
                _0Node = new IPSetTrieNode(bitString, result);
        }
    }

    public Object getLeastSpecific (LinkedList<Boolean> bitString, int index)
    {
        Boolean b;
        try {b = bitString.get(index);}
        catch (IndexOutOfBoundsException e) {return this.result;}

        /* check locally first (less specific) */
        if (this.result != null)
            return this.result;
        
        /* check down-tree second (more specific) */
        if (b.booleanValue()) {
            if (_1Node != null) 
                return _1Node.getLeastSpecific(bitString,index+1);
        }
        else {
            if (_0Node != null) 
                return _0Node.getLeastSpecific(bitString,index+1);
        }
        
        return null;
    }

    public Object getMostSpecific (LinkedList<Boolean> bitString, int index)
    {
        Boolean b;
        try {b = bitString.get(index);}
        catch (IndexOutOfBoundsException e) {
            /* You matched correctly to get here, but don't match the next level */
            return this.result;
        }

        /* check down-tree first (more specific) */
        Object lower_res = null;
        if (b.booleanValue()) {
            if (_1Node != null) {
                lower_res = _1Node.getMostSpecific(bitString,index+1);
            }
        }
        else {
            if (_0Node != null) {
                lower_res = _0Node.getMostSpecific(bitString,index+1);
            }

        }

        if (lower_res != null) {
            return lower_res;
        }

        /* check locally second (less specific) */
        return this.result;
    }

}
