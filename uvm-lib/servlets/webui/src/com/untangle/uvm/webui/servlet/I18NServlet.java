package com.untangle.uvm.webui.servlet;

import java.io.IOException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONException;
import org.json.JSONObject;
import org.xnap.commons.i18n.I18n;
import org.xnap.commons.i18n.I18nFactory;

/**
 * A servlet that when given a resource bundle's name returns a javascript hash containing all the
 * key-value pairs in that bundle.
 *
 * @author Catalin Matei <cmatei@untangle.com>
 */
public class I18NServlet extends HttpServlet {
	
	/** json content type */
	private static final String JSON_CONTENT_TYPE = "application/json";
	/** character encoding */
	private static final String CHARACTER_ENCODING = "utf-8";

	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		
		String nodeClassName = req.getParameter("nodeClassName");
		if (nodeClassName == null) { // i18n for main rack
			nodeClassName = getClass().getName();
		}

		I18n i18n = I18nFactory.getI18n(nodeClassName, "Messages", Thread.currentThread().getContextClassLoader(), req.getLocale(), I18nFactory.FALLBACK);
        Map<String, String> map = new HashMap<String, String>();
		for (Enumeration<String> enumeration = i18n.getResources().getKeys(); enumeration.hasMoreElements();) {
			String key = enumeration.nextElement(); 
			map.put(key, i18n.tr(key));
		}
        
        // Write content type and also length (determined via byte array).
        resp.setContentType(JSON_CONTENT_TYPE);
        resp.setCharacterEncoding(CHARACTER_ENCODING);
        
		try {
	        JSONObject json = createJSON( map );
	        json.write( resp.getWriter() );
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}      

	}
	
	   /**
	    * Creates a JSONObject [JSONObject,JSONArray,JSONNUll] from the map values.
	    */
	   protected JSONObject createJSON( Map map )throws JSONException {
		   return new JSONObject(map);
	   }

}
