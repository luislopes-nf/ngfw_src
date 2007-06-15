# -*-ruby-*-
# $HeadURL$
# Copyright (c) 2003-2007 Untangle, Inc. 
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License, version 2,
# as published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful, but
# AS-IS and WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE, TITLE, or
# NONINFRINGEMENT.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
#

buildutil = BuildEnv::SRC["buildutil"]

jt = JarTarget.buildTarget(buildutil, [Jars::Becl , Jars::Reporting], 'impl', ["#{SRC_HOME}/util/impl"])
BuildEnv::SRC.installTarget.installJars(jt, "#{buildutil.distDirectory}/usr/share/untangle/lib")
BuildEnv::SRC.installTarget.installJars(Jars::Becl, "#{buildutil.distDirectory}/usr/share/java/uvm")

ms = MoveSpec.new("#{SRC_HOME}/util/hier", FileList["#{SRC_HOME}/util/hier/**/*"], buildutil.distDirectory)
cf = CopyFiles.new(buildutil, ms, 'hier', BuildEnv::SRC.filterset)
buildutil.registerTarget('hier', cf)
