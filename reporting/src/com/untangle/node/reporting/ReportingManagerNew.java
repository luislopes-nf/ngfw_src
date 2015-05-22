/**
 * $Id: ReportingManagerNew.java,v 1.00 2015/03/04 13:45:51 dmorris Exp $
 */
package com.untangle.node.reporting;

import java.util.List;
import java.util.Date;
import java.util.ArrayList;

import org.json.JSONObject;

import com.untangle.uvm.node.SqlCondition;

/**
 * The API for interacting/viewing/editing reports
 */
public interface ReportingManagerNew
{
    List<ReportEntry> getReportEntries();

    List<ReportEntry> getReportEntries( String category );
    
    void setReportEntries( List<ReportEntry> newEntries );

    List<JSONObject> getDataForReportEntry( ReportEntry entry, final Date startDate, final Date endDate, final int limit );

    List<JSONObject> getDataForReportEntry( ReportEntry entry, final Date startDate, final Date endDate, SqlCondition[] extraConditions, final int limit );

    /**
     * Query events in the reports database
     */
    ArrayList<org.json.JSONObject> getEvents( final String query, final Long policyId, final SqlCondition[] extraConditions, final int limit );
    
    /**
     * Query events in the reports database
     */
    ResultSetReader getEventsResultSet( final String query, final Long policyId, final SqlCondition[] extraConditions, final int limit );
    
    /**
     * Query events in the reports database, within a given date range
     */
    ResultSetReader getEventsForDateRangeResultSet( final String query, final Long policyId, final SqlCondition[] extraConditions, final int limit, final Date startDate, final Date endDate );

    /**
     * Get a list of all tables in the database
     */
    String[] getTables();

    /**
     * Get the type of a certain column in a certain table
     */
    String getColumnType( String tableName, String columnName );

    /**
     * Get a list of all columns for a certain table
     */
    String[] getColumnsForTable( String tableName );
}