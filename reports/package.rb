# -*-ruby-*-
# $Id$

reports = BuildEnv::SRC['untangle-node-reports']

NodeBuilder.makeNode(BuildEnv::SRC, 'untangle-node-reports', 'reports')

jt = [reports['src']]
ServletBuilder.new(reports, 'com.untangle.uvm.reports.jsp', ["reports/servlets/reports"], [], jt)
