/**
 * $Id$
 */
package com.untangle.node.reports;

import java.sql.Connection;
import java.sql.Statement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;

import org.apache.log4j.Logger;
import org.json.JSONObject;

import com.untangle.uvm.UvmContextFactory;

/**
 * A ResultSetReader is an object that holds both the ResultSet from the database and the Connecition created to retrieve it.
 * This is necessary because the way postgres jdbc cursors operates.
 *
 * For large queries we don't want all the results at once, so we use a cursor.
 * Postgres JDBC cursors require autoCommit to false, and so this means a read-lock is held while the ResultSet and Connection are open
 * So you must call commit on the Connection after done reading the results. Forgetting to do so is very bad because it prevents
 * writing and vacuuming of the locked table. So there is a built in safety mechanism to close the connection if it is unused for a while
 */
public class ResultSetReader implements Runnable
{
    private static final Logger logger = Logger.getLogger(ResultSetReader.class);

    private ResultSet resultSet;
    private Connection connection;
    private Statement statement;
    private Thread thread;
    
    public ResultSetReader( ResultSet resultSet, Connection connection, Statement statement )
    {
        this.resultSet = resultSet;
        this.connection = connection;
        this.statement = statement;

        Thread thread = UvmContextFactory.context().newThread( this, "ResultSetReader" );
        thread.start();
    }

    public ResultSet getResultSet()
    {
        return this.resultSet;
    }

    public Connection getConnection()
    {
        return this.connection;
    }
    
    public ArrayList<Object> getNextChunk( int chunkSize )
    {
        ArrayList<Object> newList = new ArrayList<Object>( chunkSize );

        try {
            if ( resultSet.isClosed() )
                return newList;

            ResultSetMetaData metadata = this.resultSet.getMetaData();
            int numColumns = metadata.getColumnCount();

            for ( int i = 0 ; i < chunkSize && this.resultSet.next() ; i++ ) {
                try {
                    JSONObject row = new JSONObject();
                    for ( int columnIter = 1 ; columnIter < numColumns+1 ; columnIter++ ) {
                        Object o = resultSet.getObject( columnIter );

                        // if its a special Postgres type - change it to string
                        if (o instanceof org.postgresql.util.PGobject) {
                            o = o.toString();
                        }

                        row.put( metadata.getColumnName(columnIter), o );
                    }
                    
                    newList.add(row);
                } catch (Exception e) {
                    logger.warn("Failed to process row - skipping.",e);
                }
            }

            if ( ! this.resultSet.next() ) {
                this.closeConnection();
            }
        } catch ( java.sql.SQLException e ) {
            logger.warn("Exception retrieving events",e);
        }

        return newList;
    }

    public ArrayList<JSONObject> getAllEvents()
    {
        try {
            if (resultSet == null || connection == null)
                return null;

            ResultSetMetaData metadata = resultSet.getMetaData();
            int numColumns = metadata.getColumnCount();
                
            ArrayList<JSONObject> newList = new ArrayList<JSONObject>();

            while (resultSet.next()) {
                try {
                    JSONObject row = new JSONObject();
                    for ( int i = 1 ; i < numColumns+1 ; i++ ) {
                        Object o = resultSet.getObject( i );

                        // if its a special Postgres type - change it to string
                        if (o instanceof org.postgresql.util.PGobject) {
                            o = o.toString();
                        }
                        //logger.info( "getEvents( " + queryStr + " ) column[ " + metadata.getColumnName(i) + " ] = " + o);

                        row.put( metadata.getColumnName(i), o );
                    }
                    newList.add(row);
                } catch (Exception e) {
                    logger.warn("Failed to process row - skipping.",e);
                }
            }
            return newList;
        } catch (SQLException e) {
            logger.warn("Failed to query database", e );
            throw new RuntimeException( "Failed to query database.", e );
        } finally {
            closeConnection();
        }
    }
    
    public void closeConnection()
    {
        if ( this.statement != null ) {
            try { this.statement.close(); } catch (Exception e) {
                logger.warn("Close Exception",e);
            }
            this.statement = null;
        }
        if ( this.connection != null ) {
            try { this.connection.commit(); } catch (Exception e) {
                logger.warn("Commit Exception",e);
            }
            try { this.connection.close(); } catch (Exception e) {
                logger.warn("Close Exception",e);
            }
            this.connection = null;
        }
        if ( this.thread != null )
            this.thread.interrupt();
        
        return;
    }

    /**
     * The thread checks occasionally to make sure this reader is being used.
     * If not, it commits and closes the connection. This is because leaving
     * queries uncommited is dangerous as it holds a lock on the data.
     * This is a safety mechanism that should not be relied on, so it prints a warning
     */
    public void run()
    {
        if (this.resultSet == null) {
            logger.warn("Invalid resultSet: null");
            closeConnection();
            return;
        }
        
        try {
            int lastPosition = this.resultSet.getRow();
        
            while ( true ) {
                try {
                    Thread.sleep( 30*1000 ); /* sleep 30 seconds */
                } catch (Exception e) {}

                if ( this.connection == null || this.connection.isClosed() )
                    return;
                if ( this.resultSet == null ) {
                    logger.warn("Invalid resultSet: null");
                    closeConnection();
                    return;
                }

                if ( this.resultSet.getRow() == 0 ) {
                    logger.warn("Unclosed ResultSetReader! ( left open ) - closing!");
                    closeConnection();
                    return;
                }
                if ( lastPosition == this.resultSet.getRow() ) {
                    logger.warn("Unclosed ResultSetReader! ( stuck at row " + lastPosition + " ) - closing!");
                    closeConnection();
                    return;
                }
                lastPosition = this.resultSet.getRow();
            }
        }
        catch ( Exception e ) {
            logger.warn("Exception in ResultSetReader", e);
            closeConnection();
            return;
        } 
    }
    
}
