/**
 * $Id: TimeSerializer.java,v 1.00 2013/11/18 14:58:19 dmorris Exp $
 */
package com.untangle.uvm.webui.jabsorb.serializer;

import java.sql.Timestamp;
import java.util.Date;

import org.jabsorb.serializer.AbstractSerializer;
import org.jabsorb.serializer.MarshallException;
import org.jabsorb.serializer.ObjectMatch;
import org.jabsorb.serializer.SerializerState;
import org.jabsorb.serializer.UnmarshallException;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Serialises date and time values
 */
@SuppressWarnings({"serial","unchecked","rawtypes"})
public class TimeSerializer extends AbstractSerializer
{
    /**
     * Classes that this can serialise.
     */
    private static Class[] _serializableClasses = new Class[] {java.sql.Time.class };

    /**
     * Classes that this can serialise to.
     */
    private static Class[] _JSONClasses = new Class[] { JSONObject.class };

    public Class[] getJSONClasses()
    {
        return _JSONClasses;
    }

    public Class[] getSerializableClasses()
    {
        return _serializableClasses;
    }

    public Object marshall(SerializerState state, Object p, Object o)
        throws MarshallException
    {
        long time;
        if (o instanceof Date)
            {
                time = ((Date) o).getTime();
            }
        else
            {
                throw new MarshallException("cannot marshall date using class "
                                            + o.getClass());
            }
        JSONObject obj = new JSONObject();
        try
            {
                if (ser.getMarshallClassHints())
                    {
                        obj.put("javaClass", o.getClass().getName());
                    }
                obj.put("time", time);
            }
        catch (JSONException e)
            {
                throw (MarshallException) new MarshallException(e.getMessage()).initCause(e);
            }
        return obj;
    }

    public ObjectMatch tryUnmarshall(SerializerState state, Class clazz, Object o)
        throws UnmarshallException
    {
        JSONObject jso = (JSONObject) o;
        String java_class;
        try
            {
                java_class = jso.getString("javaClass");
            }
        catch (JSONException e)
            {
                throw new UnmarshallException("no type hint", e);
            }
        if (java_class == null)
            {
                throw new UnmarshallException("no type hint");
            }
        if (!(java_class.equals("java.util.Date")))
            {
                throw new UnmarshallException("not a Date");
            }
        state.setSerialized(o, ObjectMatch.OKAY);
        return ObjectMatch.OKAY;
    }

    public Object unmarshall(SerializerState state, Class clazz, Object o)
        throws UnmarshallException
    {
        JSONObject jso = (JSONObject) o;
        long time;
        try
            {
                time = jso.getLong("time");
            }
        catch(JSONException e)
            {
                throw new UnmarshallException("Could not get the time in date serialiser", e);
            }
        if (jso.has("javaClass"))
            {
                try
                    {
                        clazz = Class.forName(jso.getString("javaClass"));
                    }
                catch (ClassNotFoundException e)
                    {
                        throw new UnmarshallException(e.getMessage(), e);
                    }
                catch(JSONException e)
                    {
                        throw new UnmarshallException("Could not find javaClass", e);
                    }
            }
        Object returnValue = null;
        if (Date.class.equals(clazz))
            {
                returnValue = new Date(time);
            }
        else if (Timestamp.class.equals(clazz))
            {
                returnValue = new Timestamp(time);
            }
        else if (java.sql.Date.class.equals(clazz))
            {
                returnValue = new java.sql.Date(time);
            }else if (java.sql.Time.class.equals(clazz))
            {
                returnValue = new java.sql.Time(time);
            }
        if (returnValue == null)
            {
                throw new UnmarshallException("invalid class " + clazz);
            }
        state.setSerialized(o, returnValue);
        return returnValue;
    }

}