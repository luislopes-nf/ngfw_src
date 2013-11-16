/*
 * $HeadURL: svn://chef/branch/prod/web-ui/work/src/uvm-lib/localapi/com/untangle/uvm/util/XmlUtil.java $
 * Copyright (c) 2003-2007 Untangle, Inc.
 *
 * This library is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2,
 * as published by the Free Software Foundation.
 *
 * This library is distributed in the hope that it will be useful, but
 * AS-IS and WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE, TITLE, or
 * NONINFRINGEMENT.  See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Linking this library statically or dynamically with other modules is
 * making a combined work based on this library.  Thus, the terms and
 * conditions of the GNU General Public License cover the whole combination.
 *
 * As a special exception, the copyright holders of this library give you
 * permission to link this library with independent modules to produce an
 * executable, regardless of the license terms of these independent modules,
 * and to copy and distribute the resulting executable under terms of your
 * choice, provided that you also meet, for each linked independent module,
 * the terms and conditions of the license of that module.  An independent
 * module is a module which is not derived from or based on this library.
 * If you modify this library, you may extend this exception to your version
 * of the library, but you are not obligated to do so.  If you do not wish
 * to do so, delete this exception statement from your version.
 */

package com.untangle.uvm.util;

public class QueryUtil
{
    public static String toOrderByClause( String... sortColumns){
        return toOrderByClause(null, sortColumns);
    }

    public static String toOrderByClause(String alias, String... sortColumns)
    {
        final StringBuilder orderBy = new StringBuilder();
        if (0 < sortColumns.length) {
            orderBy.append("order by ");
            for (int i = 0; i < sortColumns.length; i++) {
                String col = sortColumns[i];
                String dir;
                if (col.startsWith("+")) {
                    dir = "ASC";
                    col = col.substring(1);
                } else if (col.startsWith("-")) {
                    dir = "DESC";
                    col = col.substring(1);
                } else {
                    dir = "ASC";
                }

                if (col.toUpperCase().startsWith("UPPER(")) {
                    rewriteUpper(orderBy, col, alias);
                } else {
                    if (alias != null) {
                        orderBy.append(alias);
                        orderBy.append(".");
                    }
                    orderBy.append(col);
                }

                orderBy.append(" ");
                orderBy.append(dir);
                if (i + 1 < sortColumns.length) {
                    orderBy.append(", ");
                }
            }
        }

        return orderBy.toString();
    }

    private static void rewriteUpper(StringBuilder sb, String col, String alias)
    {
        if (!col.endsWith(")")) {
            sb.append(col);
        } else {
            sb.append("upper(");
            if (alias != null) {
                sb.append(alias);
                sb.append(".");
            }
            sb.append(col.substring(6, col.length() - 1));
            sb.append(")");
        }
    }
}