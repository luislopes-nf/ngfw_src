import unittest2
import time
import sys
import datetime
from jsonrpc import ServiceProxy
from jsonrpc import JSONRPCException
from global_functions import uvmContext
from uvm import Manager
from uvm import Uvm
import remote_control
import test_registry

defaultRackId = 1
node = None

class SmtpTests(unittest2.TestCase):

    @staticmethod
    def nodeName():
        return "untangle-casing-smtp"

    @staticmethod
    def initialSetUp(self):
        global node
        if (uvmContext.nodeManager().isInstantiated(self.nodeName())):
            node = uvmContext.nodeManager().node(self.nodeName())
        else:
            node = uvmContext.nodeManager().instantiate(self.nodeName(), defaultRackId)

    def setUp(self):
        pass

    # verify client is online
    def test_010_runTests(self):
        l = node.getTests();
        for name in l['list']:
            print node.runTests(name);
            
        

test_registry.registerNode("smtp-casing", SmtpTests)
