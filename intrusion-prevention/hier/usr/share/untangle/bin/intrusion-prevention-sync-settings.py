#!/usr/bin/python
"""
Synchronize settings:
-   From an initial state with the current rules.
-   Between previous and current rules.
-   From UI patches.
"""
import errno
import os
import getopt
import sys
import subprocess
import re
import json
import time
import uvm
from uvm import Manager
from uvm import Uvm

UNTANGLE_DIR = '%s/usr/lib/python%d.%d' % ( "@PREFIX@", sys.version_info[0], sys.version_info[1] )
if ( "@PREFIX@" != ''):
    sys.path.insert(0, UNTANGLE_DIR)
	
import untangle_node_intrusion_prevention

def usage():
    """
    Show usage
    """
    print "usage..."
    print "help\t\tusage"
    print "settings\tSettings configuration file name"
    print "conf\t\tSnort configuration file name"
    print "rules\t\tSnort rule file name"
    print "node\t\tNode identifier"
    print "debug\t\tEnable debugging"
        
def main(argv):
    """
    Main
    """
    global _debug
    _debug = False
    current_rules_path = None
    previous_rules_path = None
    settings_file_name = None
    status_file_name = None
    node_id = None
    patch_file_name = None
    settings_file_name = None
    export_mode = False
	
    try:
        opts, args = getopt.getopt(argv, "hsrpnace:d", ["help", "settings=", "rules=", "previous_rules=", "node_id=", "status=", "patch=", "export", "debug"] )
    except getopt.GetoptError:
        usage()
        sys.exit(2)

    for opt, arg in opts:
        if opt in ( "-h", "--help"):
            usage()
            sys.exit()
        elif opt in ( "-d", "--debug"):
            _debug = True
        elif opt in ( "-n", "--node_id"):
            node_id = arg
        elif opt in ( "-r", "--rules"):
            current_rules_path = arg
        elif opt in ( "-p", "--previous_rules"):
            previous_rules_path = arg
        elif opt in ( "-s", "--settings"):
            settings_file_name = arg
        elif opt in ( "-a", "--status"):
            status_file_name = arg
        elif opt in ( "-p", "--patch"):
            patch_file_name = arg
        elif opt in ( "-e", "--export"):
            export_mode = True

    if node_id == None:
        print "Missing node_id"
        sys.exit(1)

    # if current_rules_path == None:
    #     print "Missing rules"
    #     sys.exit(1)

    # if settings_file_name == None:
    #     ## Must never write to actual location.
    #     print "Missing settings file name"
    #     sys.exit(1)

    if _debug == True:
        if current_rules_path != None :
            print "current_rules_path = " + current_rules_path
        if previous_rules_path != None:
            print "previous_rules_path = " + previous_rules_path
        if settings_file_name != None:
            print "settings_file_name = " + settings_file_name
        print "node = " + node_id
        print "_debug = ",  _debug

    defaults = untangle_node_intrusion_prevention.IntrusionPreventionDefaults()
    defaults.load()

    patch = None
    if patch_file_name != None:
        patch = untangle_node_intrusion_prevention.IntrusionPreventionSettingsPatch()
        patch.load(patch_file_name)

    snort_conf = untangle_node_intrusion_prevention.SnortConf()

    current_snort_rules = None
    if current_rules_path != None:
        current_snort_rules = untangle_node_intrusion_prevention.SnortRules( node_id, current_rules_path )
        current_snort_rules.load( True )
        current_snort_rules.update_categories(defaults, True)

    previous_snort_rules = None
    if previous_rules_path != None:
        previous_snort_rules = untangle_node_intrusion_prevention.SnortRules( node_id, previous_rules_path )
        previous_snort_rules.load( True )
        previous_snort_rules.update_categories(defaults, True)

    settings = untangle_node_intrusion_prevention.IntrusionPreventionSettings( node_id )
    if settings.exists() == False:
        settings.create()
    else:
        settings.load()
        settings.convert()

    if current_snort_rules != None:
        settings.rules.update_categories(defaults)

        if patch != None and "activeGroups" in patch.settings:
            #
            # For group changes, disable rule state preservation
            #
            settings.rules.update( settings, snort_conf, current_snort_rules, previous_snort_rules, False )
        else:
            settings.rules.update( settings, snort_conf, current_snort_rules, previous_snort_rules )

        profile_id = settings.settings["profileId"]
        if patch != None and "profileId" in patch.settings:
            profile_id = patch.settings["profileId"]
        defaults_profile = defaults.get_profile(profile_id)

        if defaults_profile != None:
            if patch != None:
                settings.set_patch(patch, defaults_profile)
            else:
                settings.get_rules().filter_group(settings.settings["activeGroups"], defaults_profile)

    if export_mode:
        settings.save( settings_file_name, key=patch.settings.keys()[0] )
    else:
        settings.save( settings_file_name)
    
    sys.exit()

if __name__ == "__main__":
    main( sys.argv[1:] )
