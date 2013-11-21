/**
 * $Id: DayOfWeekMatcher.java 32073 2012-06-06 20:53:24Z dmorris $
 */
package com.untangle.uvm.node;

import java.util.LinkedList;
import java.util.Date;
import java.util.Calendar;

import org.apache.log4j.Logger;

/**
 * An matcher for days of the week
 *
 * Examples:
 * "any"
 * "Monday"
 * "Monday,Tuesday"
 *
 * DayOfWeekMatcher it is case insensitive
 */
public class DayOfWeekMatcher
{
    private static final String MARKER_ANY = "any";
    private static final String MARKER_ALL = "all";
    private static final String MARKER_NONE = "none";
    private static final String MARKER_SEPERATOR = ",";
    private static final String MARKER_SUNDAY     = "sunday";
    private static final String MARKER_SUNDAY2    = "1";
    private static final String MARKER_MONDAY     = "monday";
    private static final String MARKER_MONDAY2    = "2";
    private static final String MARKER_TUESDAY    = "tuesday";
    private static final String MARKER_TUESDAY2   = "3";
    private static final String MARKER_WEDNESDAY  = "wednesday";
    private static final String MARKER_WEDNESDAY2 = "4";
    private static final String MARKER_THURSDAY   = "thursday";
    private static final String MARKER_THURSDAY2  = "5";
    private static final String MARKER_FRIDAY     = "friday";
    private static final String MARKER_FRIDAY2    = "6";
    private static final String MARKER_SATURDAY   = "saturday";
    private static final String MARKER_SATURDAY2  = "7";

    private static DayOfWeekMatcher ANY_MATCHER = new DayOfWeekMatcher(MARKER_ANY);

    private final Logger logger = Logger.getLogger(getClass());

    private enum DayOfWeekMatcherType { ANY, NONE, SINGLE, LIST };

    /**
     * The type of this matcher
     */
    private DayOfWeekMatcherType type = DayOfWeekMatcherType.NONE;

    /**
     * This stores the string representation of this matcher
     */
    private String matcher;

    /**
     * This stores the string of this representation of this single matcher
     */
    private String single;
    
    /**
     * if this port matcher is a list of port matchers, this list stores the children
     */
    private LinkedList<DayOfWeekMatcher> children = null;
    
    /**
     * Construct a day of week matcher from the given string
     */
    public DayOfWeekMatcher( String matcher )
    {
        initialize(matcher);
    }

    /**
     * returns isMatch(now())
     */
    public boolean isMatch()
    {
        return isMatch(new Date());
    }
    
    public boolean isMatch( int day )
    {
       switch (this.type) {

        case ANY:
            return true;

        case NONE:
            return false;

        case SINGLE:
            return includesDay( day );

        case LIST:
            for (DayOfWeekMatcher child : this.children) {
                if (child.isMatch( day ))
                    return true;
            }
            return false;

        default:
            logger.warn("Unknown port matcher type: " + this.type);
            return false;
        }
    }

    public boolean isMatch( Date when )
    {
       switch (this.type) {

        case ANY:
            return true;

        case NONE:
            return false;

        case SINGLE:
            Calendar cal = Calendar.getInstance();
            cal.setTime(when);
            int calDay = cal.get(Calendar.DAY_OF_WEEK);
            return includesDay( calDay );

        case LIST:
            for (DayOfWeekMatcher child : this.children) {
                if (child.isMatch(when))
                    return true;
            }
            return false;

        default:
            logger.warn("Unknown port matcher type: " + this.type);
            return false;
        }
    }

    public String toString()
    {
        return this.matcher;
    }

    public static DayOfWeekMatcher getAnyMatcher()
    {
        return ANY_MATCHER;
    }
    
    private void initialize( String matcher )
    {
        matcher = matcher.toLowerCase().trim().replaceAll("\\s","");
        this.matcher = matcher;

        /**
         * If it contains a comma it must be a list of protocol matchers
         * if so, go ahead and initialize the children
         */
        if (matcher.contains(MARKER_SEPERATOR)) {
            this.type = DayOfWeekMatcherType.LIST;

            this.children = new LinkedList<DayOfWeekMatcher>();

            String[] results = matcher.split(MARKER_SEPERATOR);
            
            /* check each one */
            for (String childString : results) {
                DayOfWeekMatcher child = new DayOfWeekMatcher(childString);
                this.children.add(child);
            }

            return;
        }

        /**
         * Check the common constants
         */
        if (MARKER_ANY.equals(matcher))  {
            this.type = DayOfWeekMatcherType.ANY;
            return;
        }
        if (MARKER_ALL.equals(matcher)) {
            this.type = DayOfWeekMatcherType.ANY;
            return;
        }
        if (MARKER_NONE.equals(matcher)) {
            this.type = DayOfWeekMatcherType.NONE;
            return;
        }
        if (MARKER_SUNDAY.equals(matcher) ||
            MARKER_SUNDAY2.equals(matcher) ||
            MARKER_MONDAY.equals(matcher) ||
            MARKER_MONDAY2.equals(matcher) ||
            MARKER_TUESDAY.equals(matcher) ||
            MARKER_TUESDAY2.equals(matcher) ||
            MARKER_WEDNESDAY.equals(matcher) ||
            MARKER_WEDNESDAY2.equals(matcher) ||
            MARKER_THURSDAY.equals(matcher) ||
            MARKER_THURSDAY2.equals(matcher) ||
            MARKER_FRIDAY.equals(matcher) ||
            MARKER_FRIDAY2.equals(matcher) ||
            MARKER_SATURDAY.equals(matcher) ||
            MARKER_SATURDAY2.equals(matcher)) {
            this.type = DayOfWeekMatcherType.SINGLE;
            this.single = matcher;
            return;
        }
    }

    private boolean includesDay( int day )
    {
        switch (day) {
        case 1:
            return (this.single.equals(MARKER_SUNDAY) || this.single.equals(MARKER_SUNDAY2));
        case 2:
            return (this.single.equals(MARKER_MONDAY) || this.single.equals(MARKER_MONDAY2));
        case 3:
            return (this.single.equals(MARKER_TUESDAY) || this.single.equals(MARKER_TUESDAY2));
        case 4:
            return (this.single.equals(MARKER_WEDNESDAY) || this.single.equals(MARKER_WEDNESDAY2));
        case 5:
            return (this.single.equals(MARKER_THURSDAY) || this.single.equals(MARKER_THURSDAY2));
        case 6:
            return (this.single.equals(MARKER_FRIDAY) || this.single.equals(MARKER_FRIDAY2));
        case 7:
            return (this.single.equals(MARKER_SATURDAY) || this.single.equals(MARKER_SATURDAY2));
        default:
            return false;
        }
    }
}