import unittest2
import time
import subprocess
from datetime import datetime
import sys
import os
import subprocess
import socket
import platform

from jsonrpc import ServiceProxy
from jsonrpc import JSONRPCException
from global_functions import uvmContext
from uvm import Manager
from uvm import Uvm
import remote_control
import global_functions

defaultRackId = 1
node = None
nodeSSL = None
nodeSSLData = None
canRelay = True
canRelayTLS = True
testsite = "test.untangle.com"
testsiteIP = socket.gethostbyname(testsite)

def addPassSite(site, enabled=True, description="description"):
    newRule =  { "enabled": enabled, "description": description, "javaClass": "com.untangle.uvm.node.GenericRule", "string": site }
    rules = node.getPassSites()
    rules["list"].append(newRule)
    node.setPassSites(rules)

def nukePassSites():
    rules = node.getPassSites()
    rules["list"] = []
    node.setPassSites(rules)

def createSSLInspectRule(port="25"):
    return {
        "action": {
            "actionType": "INSPECT",
            "flag": False,
            "javaClass": "com.untangle.node.ssl_inspector.SslInspectorRuleAction"
        },
        "conditions": {
            "javaClass": "java.util.LinkedList",
            "list": [
                {
                    "conditionType": "PROTOCOL",
                    "invert": False,
                    "javaClass": "com.untangle.node.ssl_inspector.SslInspectorRuleCondition",
                    "value": "TCP"
                },
                {
                    "conditionType": "DST_PORT",
                    "invert": False,
                    "javaClass": "com.untangle.node.ssl_inspector.SslInspectorRuleCondition",
                    "value": port
                }
            ]
        },
        "description": "Inspect" + port,
        "javaClass": "com.untangle.node.ssl_inspector.SslInspectorRule",
        "live": True,
        "ruleId": 1
    };

class VirusBlockerBaseTests(unittest2.TestCase):

    @staticmethod
    def nodeName():
        return "untangle-base-virus-blocker"

    @staticmethod
    def shortName():
        return "untangle"

    @staticmethod
    def displayName():
        return "Virus Blocker Lite"

    @staticmethod
    def nodeNameSSLInspector():
        return "untangle-casing-ssl-inspector"

    @staticmethod
    def initialSetUp(self):
        global node,md5StdNum, nodeSSL, nodeSSLData, canRelay, canRelayTLS
        # download eicar and trojan files before installing virus blocker
        remote_control.runCommand("rm -f /tmp/eicar /tmp/std_022_ftpVirusBlocked_file /tmp/temp_022_ftpVirusPassSite_file")
        result = remote_control.runCommand("wget -q -O /tmp/eicar http://test.untangle.com/virus/eicar.com")
        assert (result == 0)
        result = remote_control.runCommand("wget -q -O /tmp/std_022_ftpVirusBlocked_file ftp://" + global_functions.ftpServer + "/virus/fedexvirus.zip")
        assert (result == 0)
        md5StdNum = remote_control.runCommand("\"md5sum /tmp/std_022_ftpVirusBlocked_file | awk '{print $1}'\"", stdout=True)
        self.md5StdNum = md5StdNum
        # print "md5StdNum <%s>" % md5StdNum
        assert (result == 0)

        try:
            canRelay = global_functions.sendTestmessage(mailhost=testsiteIP)
        except Exception,e:
            canRelay = False
        try:
            canRelayTLS = global_functions.sendTestmessage(mailhost=global_functions.tlsSmtpServerHost)
        except Exception,e:
            canRelayTLS = False

        if (uvmContext.nodeManager().isInstantiated(self.nodeName())):
            raise unittest2.SkipTest('node %s already instantiated' % self.nodeName())
        node = uvmContext.nodeManager().instantiate(self.nodeName(), defaultRackId)
        self.node = node

        if uvmContext.nodeManager().isInstantiated(self.nodeNameSSLInspector()):
            raise Exception('node %s already instantiated' % self.nodeNameSSLInspector())
        nodeSSL = uvmContext.nodeManager().instantiate(self.nodeNameSSLInspector(), defaultRackId)
        # nodeSSL.start() # leave node off. node doesn't auto-start
        nodeSSLData = nodeSSL.getSettings()

    def setUp(self):
        pass

    # verify client is online
    def test_010_clientIsOnline(self):
        result = remote_control.isOnline()
        assert (result == 0)

    # test that client can http download zip
    def test_011_httpNonVirusNotBlocked(self):
        result = remote_control.runCommand("wget -q -O - http://test.untangle.com/test/test.zip 2>&1 | grep -q text123")
        assert (result == 0)

    # test that client can http download pdf
    def test_013_httpNonVirusPDFNotBlocked(self):
        result = remote_control.runCommand("wget -q -O /dev/null http://test.untangle.com/test/test.pdf")
        assert (result == 0)

    # test that client can block virus http download zip
    def test_015_httpEicarBlocked(self):
        if platform.machine().startswith('arm'):
            raise unittest2.SkipTest("local scanner not available on ARM")
        pre_events_scan = global_functions.getStatusValue(node,"scan")
        pre_events_block = global_functions.getStatusValue(node,"block")

        result = remote_control.runCommand("wget -q -O - http://test.untangle.com/virus/eicar.zip 2>&1 | grep -q blocked")
        assert (result == 0)

        post_events_scan = global_functions.getStatusValue(node,"scan")
        post_events_block = global_functions.getStatusValue(node,"block")

        assert(pre_events_scan < post_events_scan)
        assert(pre_events_block < post_events_block)

    # test that client can block virus http download zip
    def test_016_httpVirusBlocked(self):
        if platform.machine().startswith('arm'):
            raise unittest2.SkipTest("local scanner not available on ARM")
        result = remote_control.runCommand("wget -q -O - http://test.untangle.com/virus/virus.exe 2>&1 | grep -q blocked")
        assert (result == 0)

    # test that client can block virus http download zip
    def test_017_httpVirusZipBlocked(self):
        if platform.machine().startswith('arm'):
            raise unittest2.SkipTest("local scanner not available on ARM")
        result = remote_control.runCommand("wget -q -O - http://" + testsite + "/virus/fedexvirus.zip 2>&1 | grep -q blocked")
        assert (result == 0)

    # test that client can block a partial fetch after full fetch (using cache)
    def test_018_httpPartialVirusBlockedWithCache(self):
        if platform.machine().startswith('arm'):
            raise unittest2.SkipTest("local scanner not available on ARM")
        result = remote_control.runCommand("curl -L http://" + testsite + "/virus/virus.exe 2>&1 | grep -q blocked")
        assert (result == 0)
        result = remote_control.runCommand("curl -L -r '5-' http://" + testsite + "/virus/virus.exe 2>&1 | grep -q blocked")
        assert (result == 0)

    # test that client can block virus http download zip
    def test_019_httpEicarPassSite(self):
        addPassSite(testsite)
        result = remote_control.runCommand("wget -q -O - http://" + testsite + "/virus/eicar.zip 2>&1 | grep -q blocked")
        nukePassSites()
        assert (result == 1)

    # test that client can ftp download zip
    def test_021_ftpNonVirusNotBlocked(self):
        ftp_result = subprocess.call(["ping","-c","1",global_functions.ftpServer ],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        if (ftp_result != 0):
            raise unittest2.SkipTest("FTP server not available")
        result = remote_control.runCommand("wget -q -O /dev/null ftp://" + global_functions.ftpServer + "/test.zip")
        assert (result == 0)

    # test that client can ftp download PDF
    def test_023_ftpNonVirusPDFNotBlocked(self):
        ftp_result = subprocess.call(["ping","-c","1",global_functions.ftpServer ],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        if (ftp_result != 0):
            raise unittest2.SkipTest("FTP server not available")
        result = remote_control.runCommand("wget -q -O /dev/null ftp://" + global_functions.ftpServer + "/test/test.pdf")
        assert (result == 0)

    # test that client can block virus ftp download zip
    def test_025_ftpVirusBlocked(self):
        if platform.machine().startswith('arm'):
            raise unittest2.SkipTest("local scanner not available on ARM")
        ftp_result = subprocess.call(["ping","-c","1",global_functions.ftpServer ],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        if (ftp_result != 0):
            raise unittest2.SkipTest("FTP server not available")
        remote_control.runCommand("rm -f /tmp/temp_022_ftpVirusBlocked_file")
        result = remote_control.runCommand("wget -q -O /tmp/temp_022_ftpVirusBlocked_file ftp://" + global_functions.ftpServer + "/virus/fedexvirus.zip")
        assert (result == 0)
        md5TestNum = remote_control.runCommand("\"md5sum /tmp/temp_022_ftpVirusBlocked_file | awk '{print $1}'\"", stdout=True)
        print "md5StdNum <%s> vs md5TestNum <%s>" % (md5StdNum, md5TestNum)
        assert (md5StdNum != md5TestNum)

        events = global_functions.get_events(self.displayName(),'Infected Ftp Events',None,1)
        assert(events != None)
        found = global_functions.check_events( events.get('list'), 5,
                                            "s_server_addr", global_functions.ftpServer,
                                            "c_client_addr", remote_control.clientIP,
                                            "uri", "fedexvirus.zip",
                                            self.shortName() + '_clean', False )
        assert( found )

    # test that client can block virus ftp download zip
    def test_027_ftpVirusPassSite(self):
        ftp_result = subprocess.call(["ping","-c","1",global_functions.ftpServer ],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        if (ftp_result != 0):
            raise unittest2.SkipTest("FTP server not available")
        addPassSite(global_functions.ftpServer)
        remote_control.runCommand("rm -f /tmp/temp_022_ftpVirusBlocked_file")
        result = remote_control.runCommand("wget -q -O /tmp/temp_022_ftpVirusPassSite_file ftp://" + global_functions.ftpServer + "/virus/fedexvirus.zip")
        nukePassSites()
        assert (result == 0)
        md5TestNum = remote_control.runCommand("\"md5sum /tmp/temp_022_ftpVirusPassSite_file | awk '{print $1}'\"", stdout=True)
        print "md5StdNum <%s> vs md5TestNum <%s>" % (md5StdNum, md5TestNum)
        assert (md5StdNum == md5TestNum)

    def test_100_eventlog_httpVirus(self):
        if platform.machine().startswith('arm'):
            raise unittest2.SkipTest("local scanner not available on ARM")
        fname = sys._getframe().f_code.co_name
        result = remote_control.runCommand("wget -q -O - http://" + testsite + "/virus/eicar.zip?arg=%s 2>&1 | grep -q blocked" % fname)
        assert (result == 0)

        events = global_functions.get_events(self.displayName(),'Infected Web Events',None,1)
        assert(events != None)
        found = global_functions.check_events( events.get('list'), 5,
                                            "host", testsite,
                                            "uri", ("/virus/eicar.zip?arg=%s" % fname),
                                            self.shortName() + '_clean', False )
        assert( found )

    def test_101_eventlog_httpNonVirus(self):
        fname = sys._getframe().f_code.co_name
        result = remote_control.runCommand("wget -q -O - http://" + testsite + "/test/test.zip?arg=%s 2>&1 | grep -q text123" % fname)
        assert (result == 0)

        events = global_functions.get_events(self.displayName(),'Clean Web Events',None,1)
        assert(events != None)
        found = global_functions.check_events( events.get('list'), 5,
                                            "host", testsite,
                                            "uri", ("/test/test.zip?arg=%s" % fname),
                                            self.shortName() + '_clean', True )
        assert( found )

    def test_102_eventlog_ftpVirus(self):
        if platform.machine().startswith('arm'):
            raise unittest2.SkipTest("local scanner not available on ARM")
        ftp_result = subprocess.call(["ping","-c","1",global_functions.ftpServer ],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        if (ftp_result != 0):
            raise unittest2.SkipTest("FTP server not available")
        fname = sys._getframe().f_code.co_name
        result = remote_control.runCommand("wget -q -O /tmp/temp_022_ftpVirusBlocked_file ftp://" + global_functions.ftpServer + "/virus/fedexvirus.zip")
        assert (result == 0)

        events = global_functions.get_events(self.displayName(),'Infected Ftp Events',None,1)
        assert(events != None)
        found = global_functions.check_events( events.get('list'), 5,
                                            "uri", "fedexvirus.zip",
                                            self.shortName() + '_clean', False )
        assert( found )

    def test_103_eventlog_ftpNonVirus(self):
        ftp_result = subprocess.call(["ping","-c","1",global_functions.ftpServer ],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        if (ftp_result != 0):
            raise unittest2.SkipTest("FTP server not available")
        fname = sys._getframe().f_code.co_name
        result = remote_control.runCommand("wget -q -O /dev/null ftp://" + global_functions.ftpServer + "/test.zip")
        assert (result == 0)

        events = global_functions.get_events(self.displayName(),'Clean Ftp Events',None,1)
        assert(events != None)
        found = global_functions.check_events( events.get('list'), 5,
                                            "uri", "test.zip",
                                            self.shortName() + '_clean', True )
        assert( found )

    def test_104_eventlog_smtpVirus(self):
        if platform.machine().startswith('arm'):
            raise unittest2.SkipTest("local scanner not available on ARM")
        if (not canRelay):
            raise unittest2.SkipTest('Unable to relay through test.untangle.com')
        startTime = datetime.now()
        fname = sys._getframe().f_code.co_name
        # download the email script
        result = remote_control.runCommand("wget -q -O /tmp/email_script.py http://" + testsite + "/test/email_script.py")
        assert (result == 0)
        result = remote_control.runCommand("chmod 775 /tmp/email_script.py")
        assert (result == 0)
        # email the file
        result = remote_control.runCommand("/tmp/email_script.py --server=%s --from=junk@test.untangle.com --to=junk@test.untangle.com --subject='%s' --body='body' --file=/tmp/eicar" % (testsiteIP, fname))
        assert (result == 0)

        events = global_functions.get_events(self.displayName(),'Infected Email Events',None,1)
        assert(events != None)
        found = global_functions.check_events( events.get('list'), 5,
                                            "addr", "junk@test.untangle.com",
                                            "subject", str(fname),
                                            self.shortName() + '_clean', False,
                                            min_date=startTime )
        assert( found )

    def test_105_eventlog_smtpNonVirus(self):
        if (not canRelay):
            raise unittest2.SkipTest('Unable to relay through ' + testsite)
        startTime = datetime.now()
        fname = sys._getframe().f_code.co_name
        print "fname: %s" % fname
        result = remote_control.runCommand("echo '%s' > /tmp/attachment-%s" % (fname, fname))
        assert (result == 0)
        # download the email script
        result = remote_control.runCommand("wget -q -O /tmp/email_script.py http://" + testsite + "/test/email_script.py")
        assert (result == 0)
        result = remote_control.runCommand("chmod 775 /tmp/email_script.py")
        assert (result == 0)
        # email the file
        result = remote_control.runCommand("/tmp/email_script.py --server=%s --from=junk@test.untangle.com --to=junk@test.untangle.com --subject='%s' --body='body' --file=/tmp/attachment-%s" % (testsiteIP, fname, fname))
        assert (result == 0)

        events = global_functions.get_events(self.displayName(),'Clean Email Events',None,1)
        assert(events != None)
        found = global_functions.check_events( events.get('list'), 5,
                                            "addr", "junk@test.untangle.com",
                                            "subject", str(fname),
                                            self.shortName() + '_clean', True,
                                            min_date=startTime )
        assert( found )

    def test_106_eventlog_smtpVirusPassList(self):
        if (not canRelay):
            raise unittest2.SkipTest('Unable to relay through ' + testsite)
        addPassSite(testsiteIP)
        startTime = datetime.now()
        fname = sys._getframe().f_code.co_name
        result = remote_control.runCommand("echo '%s' > /tmp/attachment-%s" % (fname, fname))
        if result != 0:
            nukePassSites()
            assert( False )
        # download the email script
        result = remote_control.runCommand("wget -q -O /tmp/email_script.py http://" + testsite + "/test/email_script.py")
        if result != 0:
            nukePassSites()
            assert( False )
        result = remote_control.runCommand("chmod 775 /tmp/email_script.py")
        if result != 0:
            nukePassSites()
            assert( False )
        # email the file
        result = remote_control.runCommand("/tmp/email_script.py --server=%s --from=junk@test.untangle.com --to=junk@test.untangle.com --subject='%s' --body='body' --file=/tmp/eicar" % (testsiteIP, fname))
        nukePassSites()
        assert (result == 0)

        events = global_functions.get_events(self.displayName(),'Clean Email Events',None,1)
        assert(events != None)
        found = global_functions.check_events( events.get('list'), 5,
                                            "addr", "junk@test.untangle.com",
                                            "subject", str(fname),
                                            self.shortName() + '_clean', True,
                                            min_date=startTime )
        assert( found )

    def test_110_eventlog_smtpSSLVirus(self):
        if platform.machine().startswith('arm'):
            raise unittest2.SkipTest("local scanner not available on ARM")
        if (not canRelayTLS):
            raise unittest2.SkipTest('Unable to relay through ' + global_functions.tlsSmtpServerHost)
        startTime = datetime.now()
        fname = sys._getframe().f_code.co_name
        # download the email script
        result = remote_control.runCommand("wget -q -O /tmp/email_script.py http://" + testsite + "/test/email_script.py")
        assert (result == 0)
        result = remote_control.runCommand("chmod 775 /tmp/email_script.py")
        assert (result == 0)
        # Turn on SSL Inspector
        nodeSSLData['processEncryptedMailTraffic'] = True
        nodeSSLData['ignoreRules']['list'].insert(0,createSSLInspectRule("25"))
        nodeSSL.setSettings(nodeSSLData)
        nodeSSL.start()
        # email the file
        result = remote_control.runCommand("/tmp/email_script.py --server=%s --from=junk@test.untangle.com --to=junk@test.untangle.com --subject='%s' --body='body' --file=/tmp/eicar --starttls" % (global_functions.tlsSmtpServerHost, fname),nowait=False)
        nodeSSL.stop()
        assert (result == 0)

        events = global_functions.get_events(self.displayName(),'Infected Email Events',None,1)
        # print events['list'][0]
        assert(events != None)
        found = global_functions.check_events( events.get('list'), 5,
                                            "addr", "junk@test.untangle.com",
                                            "subject", str(fname),
                                            's_server_addr', global_functions.tlsSmtpServerHost,
                                            self.shortName() + '_clean', False,
                                            min_date=startTime)
        assert( found )

    # test ftp using large test file
    def test_120_ftpLargeClean(self):
        if remote_control.quickTestsOnly:
            raise unittest2.SkipTest('Skipping a time consuming test')
        ftp_result = subprocess.call(["ping","-c","1",global_functions.ftpServer ],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        if (ftp_result != 0):
            raise unittest2.SkipTest("FTP server not available")
        md5LargePDFClean = "06b3cc0a1430c2aaf449b46c72fecee5"
        remote_control.runCommand("rm -f /tmp/temp_120_ftpVirusClean_file")
        result = remote_control.runCommand("wget -q -O /tmp/temp_120_ftpVirusClean_file ftp://" + global_functions.ftpServer + "/debian-live-8.6.0-amd64-standard.iso")
        assert (result == 0)
        md5TestNum = remote_control.runCommand("\"md5sum /tmp/temp_120_ftpVirusClean_file | awk '{print $1}'\"", stdout=True)
        print "md5LargePDFClean <%s> vs md5TestNum <%s>" % (md5LargePDFClean, md5TestNum)
        assert (md5LargePDFClean == md5TestNum)

    def test_300_disableAllScans(self):
        virusSettings = self.node.getSettings()

        self.node.clearAllEventHandlerCaches()

        virusSettings['enableCloudScan'] = False
        virusSettings['enableLocalScan'] = False
        self.node.setSettings(virusSettings)

        result = remote_control.runCommand("wget -q -O - http://test.untangle.com/virus/eicar.zip 2>&1 | grep -q blocked")

        virusSettings['enableCloudScan'] = True
        virusSettings['enableLocalScan'] = True
        self.node.setSettings(virusSettings)
        assert (result != 0)

    @staticmethod
    def finalTearDown(self):
        global node, nodeSSL
        if node != None:
            uvmContext.nodeManager().destroy( node.getNodeSettings()["id"] )
            node = None
        if nodeSSL != None:
            uvmContext.nodeManager().destroy( nodeSSL.getNodeSettings()["id"] )
            nodeSSL = None
