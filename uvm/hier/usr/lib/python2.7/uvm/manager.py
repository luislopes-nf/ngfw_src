from time import strftime, gmtime

class Manager(object):
    __protocols = { 6 : [ "TCP", "TCP" ], 17 : [ "UDP", "UDP" ] }
    __states = { 0 : "CLOSED", 4 : "OPEN", 5 : "H_IN", 6 : "H_OUT" }

    managers = []

    policyId = None
    verbosity = 0
    
    def shortNameToPackageName(self,shortName):
        if ( shortName == "http" or shortName == "ftp" or shortName == "mail" ): return "untangle-casing-" + shortName
        return "untangle-node-" + shortName

    def doAptTailLog(self, key ):
        print "Operation started, please apt.log for more information"

    def buildNodeId(self, nodeIdStr ):
        nodeId = int( nodeIdStr )
        return {'javaClass': 'com.untangle.uvm.node.NodeSettings', 'id': nodeId, 'name': "%d" % ( nodeId ) }

    def buildDate(self,seconds):
        return { 'javaClass' : 'java.util.Date', 'time' : ( seconds * 1000 ) }

    def formatProtocol(self,protocol):
        return Manager.__protocols[int(protocol)]
    
    def formatState( self, state ):
        return Manager.__states[int(state)]

    def formatTime( self, time ):
        millis = time["time"]
        format = "%H:%M:%S," + str( millis % 1000 )
        return strftime( format, gmtime( millis / 1000 ))
