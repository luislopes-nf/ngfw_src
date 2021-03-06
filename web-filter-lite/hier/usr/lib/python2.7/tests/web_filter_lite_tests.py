import unittest
import time
import sys
from jsonrpc import ServiceProxy
from jsonrpc import JSONRPCException
from uvm import Manager
from uvm import Uvm
import remote_control
from tests.web_filter_base_tests import WebFilterBaseTests
import test_registry

#
# Just extends the web filter tests
#
class WebFilterLiteTests(WebFilterBaseTests):

    @staticmethod
    def nodeName():
        return "untangle-node-web-filter-lite"

    @staticmethod
    def shortNodeName():
        return "web-filter-lite"

    @staticmethod
    def eventNodeName():
        return "web_filter_lite"

    @staticmethod
    def displayName():
        return "Web Filter Lite"

    @staticmethod
    def vendorName():
        return "untangle"

test_registry.registerNode("web-filter-lite", WebFilterLiteTests)
