import unittest2
import time
import sys
import pdb
import os
import subprocess
from jsonrpc import ServiceProxy
from jsonrpc import JSONRPCException
from uvm import Manager
from uvm import Uvm
from untangle_tests import ClientControl
from untangle_tests import TestDict

uvmContext = Uvm().getUvmContext()
defaultRackId = 1
clientControl = ClientControl()
nodeData = None
node = None
qaHostVPN = "10.5.6.57"
qaHostVPNLanIP = "192.168.234.57"
# special box with testshell in the sudoer group
# with no password and openvpn installed.
qaClientVPN = "10.5.6.32"  
tunnelUp = False

#pdb.set_trace()

def flushEvents():
    reports = uvmContext.nodeManager().node("untangle-node-ipsec")
    if (reports != None):
        reports.flushEvents()

def setUpClient():
    return {
            "enabled": True, 
            "export": False, 
            "exportNetwork": "127.0.0.1", 
            "groupId": 1, 
            "javaClass": "com.untangle.node.openvpn.OpenVpnRemoteClient", 
            "name": "atsclient"
    }

class OpenVpnTests(unittest2.TestCase):

    @staticmethod
    def nodeName():
        return "untangle-node-openvpn"

    @staticmethod
    def vendorName():
        return "Untangle"
        
    def setUp(self):
        global node, nodeData, vpnHostResult, vpnClientResult
        if node == None:
            if (uvmContext.nodeManager().isInstantiated(self.nodeName())):
                print "ERROR: Node %s already installed" % self.nodeName()
                raise Exception('node %s already instantiated' % self.nodeName())
            node = uvmContext.nodeManager().instantiate(self.nodeName(), defaultRackId)
            node.start()
            nodeData = node.getSettings()
            nodeData["serverEnabled"]=True
            node.setSettings(nodeData)
            vpnHostResult = subprocess.call(["ping","-c","1",qaHostVPN],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
            vpnClientResult = subprocess.call(["ping","-c","1",qaClientVPN],stdout=subprocess.PIPE,stderr=subprocess.PIPE)

    # verify client is online
    def test_010_clientIsOnline(self):
        ClientControl.verbosity = 1
        result = clientControl.runCommand("wget -4 -t 2 --timeout=5 -o /dev/null http://test.untangle.com/")
        assert (result == 0)

    def test_020_createVPNTunnel(self):
        global tunnelUp
        if (vpnHostResult != 0):
            raise unittest2.SkipTest("No paried VPN server available")
        # Download remote system VPN config
        result = os.system("wget -o /dev/null -t 1 --timeout=3 http://test.untangle.com/test/config-9.4-ats-test-site2-site-client.zip -O /tmp/config.zip")
        assert (result == 0) # verify the download was successful
        node.importClientConfig("/tmp/config.zip")
        # nodeData = node.getSettings()
        # print nodeData
        time.sleep(10) # wait for vpn tunnel to form
        remoteHostResult = subprocess.call(["ping","-c","1",qaHostVPNLanIP],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        assert (remoteHostResult == 0)
        tunnelUp = True
        
    def test_030_disableRemoteClientVPNTunnel(self):
        global tunnelUp
        if (not tunnelUp):
            raise unittest2.SkipTest("previous test test_020_createVPNTunnel failed")
        nodeData = node.getSettings()
        print nodeData
        i=0
        found = False
        for remoteGuest in nodeData['remoteServers']['list']:
            if (remoteGuest['name'] == 'test'):
                found = True 
            if (not found):
                i+=1
        assert (found) # test profile not found in remoteServers list
        nodeData['remoteServers']['list'][i]['enabled'] = False
        node.setSettings(nodeData)
        time.sleep(10) # wait for vpn tunnel to fall
        remoteHostResult = subprocess.call(["ping","-c","1",qaHostVPNLanIP],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        assert (remoteHostResult != 0)
        tunnelUp = False
        
    def test_040_createClientVPNTunnel(self):
        global nodeData
        if (vpnClientResult != 0):
            raise unittest2.SkipTest("No paried VPN client available")
        nodeData = node.getSettings()
        siteName = nodeData['siteName']  
        nodeData['remoteClients']['list'].append(setUpClient())
        node.setSettings(nodeData)
        clientLink = node.getClientDistributionDownloadLink("atsclient","zip")
        print clientLink
        # download client config file
        result = os.system("wget -o /dev/null -t 1 --timeout=3 http://localhost"+clientLink+" -O /tmp/clientconfig.zip")
        assert (result == 0)
        # copy the config file to the remote PC
        result = os.system("scp -i /usr/lib/python2.6/untangle_tests/testShell.key /tmp/clientconfig.zip testshell@" + qaClientVPN + ":/tmp/")
        # unzip the config file on the remote PC
        result = os.system("ssh -i /usr/lib/python2.6/untangle_tests/testShell.key testshell@" + qaClientVPN + " \"sudo unzip -o /tmp/clientconfig.zip -d /tmp/\"")
        # remove any existing openvpn config files
        result = os.system("ssh -i /usr/lib/python2.6/untangle_tests/testShell.key testshell@" + qaClientVPN + " \"sudo rm -f /etc/openvpn/*.conf; sudo rm -f /etc/openvpn/*.ovpn; sudo rm -rf /etc/openvpn/keys\"")
        # move the config files to the openvpn directory
        result = os.system("ssh -i /usr/lib/python2.6/untangle_tests/testShell.key testshell@" + qaClientVPN + " \"sudo mv -f /tmp/untangle-vpn/* /etc/openvpn/\"")
        # connect openvpn from the PC to the Untangle server.
        result = os.system("ssh -i /usr/lib/python2.6/untangle_tests/testShell.key testshell@" + qaClientVPN + " \"cd /etc/openvpn; sudo openvpn "+siteName+".conf &\"")
        time.sleep(10) # wait for vpn tunnel to form
        result = subprocess.call(["ping","-c","1",ClientControl.hostIP],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        # stop the vpn tunnel
        result = os.system("ssh -i /usr/lib/python2.6/untangle_tests/testShell.key testshell@" + qaClientVPN + " \"sudo pkill openvpn\"")
        assert(result==0)
        
    def test_999_finalTearDown(self):
        global node
        uvmContext.nodeManager().destroy( node.getNodeSettings()["id"] )
        node = None

TestDict.registerNode("openvpn", OpenVpnTests)
