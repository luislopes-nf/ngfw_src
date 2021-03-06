/**
 * $Id$
 */
package com.untangle.uvm.setup.servlet;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.untangle.uvm.UvmContextFactory;

/**
 * A servlet which will display the start page
 */
@SuppressWarnings("serial")
public class Welcome extends HttpServlet
{
    private static final String WEBUI_URL = "/webui/startPage.do";
    private static final String SETUP_URL = "/setup/language.do";
        
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException 
    {        
        String url = WEBUI_URL;

        /* If the setup wizard is not complete send them to the setup page. */
        if ( !UvmContextFactory.context().isWizardComplete() ) url = SETUP_URL;

        if (request.getParameter("console") != null && request.getParameter("console").equals("1")) {
            url = url + "?console=1";
        }

        response.sendRedirect( url );
    }
}
