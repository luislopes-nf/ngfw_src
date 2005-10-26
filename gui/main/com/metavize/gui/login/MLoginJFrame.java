/*
 * Copyright (c) 2004, 2005 Metavize Inc.
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * Metavize Inc. ("Confidential Information").  You shall
 * not disclose such Confidential Information.
 *
 * $Id$
 */

package com.metavize.gui.login;

import java.awt.*;
import java.lang.Thread;
import java.lang.reflect.*;
import javax.security.auth.login.FailedLoginException;
import javax.swing.*;

import com.metavize.gui.main.MMainJFrame;
import com.metavize.gui.util.*;
import com.metavize.mvvm.*;
import com.metavize.mvvm.client.*;
import com.metavize.mvvm.security.*;



public class MLoginJFrame extends javax.swing.JFrame {

    private MMainJFrame mMainJFrame;

    public MLoginJFrame(final String[] args) {

	// PARSE ARGS
	boolean isEgdemo=false;
	if( args.length == 0 )
	    Util.printMessage("[no args]");
	for( String arg : args )
	    Util.printMessage("[arg: " + arg + "]");
	for( String arg : args ) // isLocak
	    if( arg.equals("local") ){
		Util.setLocal(true);
		break;
	    }
	
	// PRINT THE LOCATION OF THE CLIENT
	if( Util.isLocal() )
	    Util.printMessage("[Running on localhost]");
	else
	    Util.printMessage("[Running remotely]");
	
	// CREATE AND SHOW THE LOGIN
	SwingUtilities.invokeLater( new Runnable(){ public void run(){
	    initComponents();
	    Util.setMLoginJFrame(MLoginJFrame.this);
	    Util.setStatusJProgressBar(statusJProgressBar);
	    MLoginJFrame.this.setBounds( Util.generateCenteredBounds(null, MLoginJFrame.this.getWidth(), MLoginJFrame.this.getHeight()) );
	    serverJTextField.setText( Util.getServerCodeBase().getHost() );
	    if( Util.isSecureViaHttps() )
		protocolJTextField.setText( "https (secure)");
	    else
		protocolJTextField.setText( "http (standard)");
	    MLoginJFrame.this.setVisible(true);
	}});
	resetLogin("Please enter your login and password.");
	SwingUtilities.invokeLater( new Runnable(){ public void run(){
	    if( Util.getServerCodeBase().getHost().equals("egdemo.metavize.com") ){
		loginJTextField.setText("egdemo");
		passJPasswordField.setText("egdemo");
	    }
	}});
    }
    
    
    public void resetLogin(final String message){
	SwingUtilities.invokeLater( new Runnable(){ public void run(){
	    acceptJButton.setEnabled(true);
	    loginJTextField.setEnabled(true);
	    passJPasswordField.setEnabled(true);
	    passJPasswordField.setText("");
	    if(loginJTextField.getText().length() == 0)
		loginJTextField.requestFocus();
	    else
		passJPasswordField.requestFocus();
	    serverJTextField.setEnabled(true);
	    protocolJTextField.setEnabled(true);
	    statusJProgressBar.setString(message);
	    statusJProgressBar.setValue(0);
	    statusJProgressBar.setIndeterminate(false);
	}});
    }
    
    
    public void reshowLogin(){
	SwingUtilities.invokeLater( new Runnable(){ public void run(){
	    synchronized(this){
		if(mMainJFrame != null){
		    mMainJFrame.setVisible(false);
		    mMainJFrame.dispose();
		    mMainJFrame = null;
		}
		if(!MLoginJFrame.this.isVisible()){
		    MLoginJFrame.this.setVisible(true);
		}
	    }
	}});
    }
    
    
    private boolean alreadyLoggedIn() {
        LoginSession loginSession = MvvmRemoteContextFactory.factory().loginSession();
        LoginSession[] loggedInUsers = Util.getMvvmContext().adminManager().loggedInUsers();
        int mySessionId = loginSession.getSessionId();
	
        String mySessionName = loginSession.getMvvmPrincipal().getName();
	
	
        int tempSessionId;
        String otherUserName = null;
        if(loggedInUsers.length > 1){
            for(int i=0; i<loggedInUsers.length; i++){
                tempSessionId = loggedInUsers[i].getSessionId();
                if(mySessionId != tempSessionId){
                    otherUserName = loggedInUsers[i].getMvvmPrincipal().getName();
                    if(otherUserName.equals(mySessionName))
                        return true;
                }
            }
            return false;
        }
        else
            return false;
    }


    private int loginCount() {
        LoginSession loginSession = MvvmRemoteContextFactory.factory().loginSession();
        LoginSession[] loggedInUsers = Util.getMvvmContext().adminManager().loggedInUsers();
        return loggedInUsers.length - 1;
    }


    public JProgressBar getStatusJProgressBar(){
        return statusJProgressBar;
    }


    private void initComponents() {//GEN-BEGIN:initComponents
        java.awt.GridBagConstraints gridBagConstraints;

        contentJPanel = new javax.swing.JPanel();
        inputJPanel = new javax.swing.JPanel();
        loginJTextField = new javax.swing.JTextField();
        passJPasswordField = new javax.swing.JPasswordField();
        serverJTextField = new javax.swing.JTextField();
        protocolJTextField = new javax.swing.JTextField();
        loginJLabel = new javax.swing.JLabel();
        passJLabel = new javax.swing.JLabel();
        serverJLabel = new javax.swing.JLabel();
        protocolJLabel = new javax.swing.JLabel();
        acceptJButton = new javax.swing.JButton();
        statusJProgressBar = new javax.swing.JProgressBar();
        logoLabel = new javax.swing.JLabel();
        backgroundJLabel = new com.metavize.gui.widgets.MTiledIconLabel();

        setDefaultCloseOperation(javax.swing.WindowConstants.DISPOSE_ON_CLOSE);
        setTitle("Metavize EdgeGuard v" + Version.getVersion());
        setIconImage((new javax.swing.ImageIcon( this.getClass().getResource("/com/metavize/gui/icons/LogoNoText16x16.gif"))).getImage());
        setName("loginJFrame");
        setResizable(false);
        addWindowListener(new java.awt.event.WindowAdapter() {
            public void windowClosing(java.awt.event.WindowEvent evt) {
                exitForm(evt);
            }
        });

        contentJPanel.setLayout(new java.awt.GridBagLayout());

        contentJPanel.setMaximumSize(new java.awt.Dimension(330, 421));
        contentJPanel.setOpaque(false);
        contentJPanel.setPreferredSize(new java.awt.Dimension(330, 400));
        inputJPanel.setLayout(new java.awt.GridBagLayout());

        inputJPanel.setFocusable(false);
        inputJPanel.setOpaque(false);
        loginJTextField.setFont(new java.awt.Font("Arial", 0, 12));
        loginJTextField.setHorizontalAlignment(javax.swing.JTextField.LEFT);
        loginJTextField.setDoubleBuffered(true);
        loginJTextField.setMinimumSize(new java.awt.Dimension(150, 20));
        loginJTextField.setPreferredSize(new java.awt.Dimension(150, 20));
        loginJTextField.setVerifyInputWhenFocusTarget(false);
        loginJTextField.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                loginJTextFieldActionPerformed(evt);
            }
        });

        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 1;
        gridBagConstraints.gridy = 0;
        gridBagConstraints.fill = java.awt.GridBagConstraints.HORIZONTAL;
        gridBagConstraints.weightx = 1.0;
        gridBagConstraints.insets = new java.awt.Insets(0, 0, 5, 0);
        inputJPanel.add(loginJTextField, gridBagConstraints);

        passJPasswordField.setFont(new java.awt.Font("Arial", 0, 12));
        passJPasswordField.setDoubleBuffered(true);
        passJPasswordField.setMinimumSize(new java.awt.Dimension(4, 20));
        passJPasswordField.setPreferredSize(new java.awt.Dimension(150, 20));
        passJPasswordField.setVerifyInputWhenFocusTarget(false);
        passJPasswordField.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                passJPasswordFieldActionPerformed(evt);
            }
        });

        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 1;
        gridBagConstraints.gridy = 1;
        gridBagConstraints.fill = java.awt.GridBagConstraints.HORIZONTAL;
        gridBagConstraints.weightx = 1.0;
        gridBagConstraints.insets = new java.awt.Insets(0, 0, 5, 0);
        inputJPanel.add(passJPasswordField, gridBagConstraints);

        serverJTextField.setEditable(false);
        serverJTextField.setFont(new java.awt.Font("Arial", 0, 12));
        serverJTextField.setDoubleBuffered(true);
        serverJTextField.setFocusable(false);
        serverJTextField.setMaximumSize(new java.awt.Dimension(133, 20));
        serverJTextField.setMinimumSize(new java.awt.Dimension(133, 20));
        serverJTextField.setPreferredSize(new java.awt.Dimension(150, 20));
        serverJTextField.setRequestFocusEnabled(false);
        serverJTextField.setVerifyInputWhenFocusTarget(false);
        serverJTextField.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                serverJTextFieldActionPerformed(evt);
            }
        });

        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 1;
        gridBagConstraints.gridy = 2;
        gridBagConstraints.gridwidth = 2;
        gridBagConstraints.fill = java.awt.GridBagConstraints.HORIZONTAL;
        gridBagConstraints.insets = new java.awt.Insets(0, 0, 5, 0);
        inputJPanel.add(serverJTextField, gridBagConstraints);

        protocolJTextField.setEditable(false);
        protocolJTextField.setFont(new java.awt.Font("Arial", 0, 12));
        protocolJTextField.setDoubleBuffered(true);
        protocolJTextField.setFocusable(false);
        protocolJTextField.setMaximumSize(new java.awt.Dimension(133, 20));
        protocolJTextField.setMinimumSize(new java.awt.Dimension(133, 20));
        protocolJTextField.setPreferredSize(new java.awt.Dimension(150, 20));
        protocolJTextField.setRequestFocusEnabled(false);
        protocolJTextField.setVerifyInputWhenFocusTarget(false);
        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 1;
        gridBagConstraints.gridy = 3;
        gridBagConstraints.gridwidth = 2;
        gridBagConstraints.fill = java.awt.GridBagConstraints.HORIZONTAL;
        inputJPanel.add(protocolJTextField, gridBagConstraints);

        loginJLabel.setFont(new java.awt.Font("Arial", 0, 12));
        loginJLabel.setHorizontalAlignment(javax.swing.SwingConstants.RIGHT);
        loginJLabel.setText("Login: ");
        loginJLabel.setDoubleBuffered(true);
        loginJLabel.setFocusable(false);
        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 0;
        gridBagConstraints.gridy = 0;
        gridBagConstraints.fill = java.awt.GridBagConstraints.BOTH;
        gridBagConstraints.insets = new java.awt.Insets(0, 0, 5, 0);
        inputJPanel.add(loginJLabel, gridBagConstraints);

        passJLabel.setFont(new java.awt.Font("Arial", 0, 12));
        passJLabel.setHorizontalAlignment(javax.swing.SwingConstants.RIGHT);
        passJLabel.setText("Password: ");
        passJLabel.setDoubleBuffered(true);
        passJLabel.setFocusable(false);
        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 0;
        gridBagConstraints.gridy = 1;
        gridBagConstraints.fill = java.awt.GridBagConstraints.BOTH;
        gridBagConstraints.insets = new java.awt.Insets(0, 0, 5, 0);
        inputJPanel.add(passJLabel, gridBagConstraints);

        serverJLabel.setFont(new java.awt.Font("Arial", 0, 12));
        serverJLabel.setHorizontalAlignment(javax.swing.SwingConstants.RIGHT);
        serverJLabel.setText("Server: ");
        serverJLabel.setDoubleBuffered(true);
        serverJLabel.setFocusable(false);
        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 0;
        gridBagConstraints.gridy = 2;
        gridBagConstraints.fill = java.awt.GridBagConstraints.BOTH;
        gridBagConstraints.insets = new java.awt.Insets(0, 0, 5, 0);
        inputJPanel.add(serverJLabel, gridBagConstraints);

        protocolJLabel.setFont(new java.awt.Font("Arial", 0, 12));
        protocolJLabel.setHorizontalAlignment(javax.swing.SwingConstants.RIGHT);
        protocolJLabel.setText("Connection: ");
        protocolJLabel.setDoubleBuffered(true);
        protocolJLabel.setFocusable(false);
        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 0;
        gridBagConstraints.gridy = 3;
        gridBagConstraints.fill = java.awt.GridBagConstraints.BOTH;
        inputJPanel.add(protocolJLabel, gridBagConstraints);

        acceptJButton.setFont(new java.awt.Font("Default", 0, 12));
        acceptJButton.setText("Login");
        acceptJButton.setDoubleBuffered(true);
        acceptJButton.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                acceptJButtonActionPerformed(evt);
            }
        });
        acceptJButton.addKeyListener(new java.awt.event.KeyAdapter() {
            public void keyPressed(java.awt.event.KeyEvent evt) {
                acceptJButtonKeyPressed(evt);
            }
        });

        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 0;
        gridBagConstraints.gridy = 4;
        gridBagConstraints.gridwidth = 2;
        gridBagConstraints.insets = new java.awt.Insets(20, 0, 0, 0);
        inputJPanel.add(acceptJButton, gridBagConstraints);

        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 0;
        gridBagConstraints.gridy = 1;
        gridBagConstraints.fill = java.awt.GridBagConstraints.HORIZONTAL;
        gridBagConstraints.anchor = java.awt.GridBagConstraints.NORTH;
        gridBagConstraints.weightx = 1.0;
        gridBagConstraints.insets = new java.awt.Insets(0, 30, 20, 30);
        contentJPanel.add(inputJPanel, gridBagConstraints);

        statusJProgressBar.setFont(new java.awt.Font("Default", 0, 12));
        statusJProgressBar.setForeground(new java.awt.Color(68, 91, 255));
        statusJProgressBar.setDoubleBuffered(true);
        statusJProgressBar.setMaximumSize(new java.awt.Dimension(32767, 16));
        statusJProgressBar.setMinimumSize(new java.awt.Dimension(10, 16));
        statusJProgressBar.setPreferredSize(new java.awt.Dimension(150, 16));
        statusJProgressBar.setString("");
        statusJProgressBar.setStringPainted(true);
        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 0;
        gridBagConstraints.gridy = 2;
        gridBagConstraints.fill = java.awt.GridBagConstraints.HORIZONTAL;
        gridBagConstraints.weightx = 1.0;
        gridBagConstraints.insets = new java.awt.Insets(0, 30, 30, 30);
        contentJPanel.add(statusJProgressBar, gridBagConstraints);

        logoLabel.setHorizontalAlignment(javax.swing.SwingConstants.CENTER);
        logoLabel.setIcon(new javax.swing.ImageIcon(getClass().getResource("/com/metavize/gui/icons/LogoNoText96x96.png")));
        logoLabel.setDoubleBuffered(true);
        logoLabel.setFocusable(false);
        logoLabel.setHorizontalTextPosition(javax.swing.SwingConstants.CENTER);
        logoLabel.setIconTextGap(0);
        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 0;
        gridBagConstraints.gridy = 0;
        gridBagConstraints.gridwidth = 2;
        gridBagConstraints.anchor = java.awt.GridBagConstraints.NORTH;
        gridBagConstraints.insets = new java.awt.Insets(48, 96, 48, 96);
        contentJPanel.add(logoLabel, gridBagConstraints);

        backgroundJLabel.setIcon(new javax.swing.ImageIcon(getClass().getResource("/com/metavize/gui/images/LightGreyBackground1600x100.png")));
        backgroundJLabel.setDoubleBuffered(true);
        backgroundJLabel.setFocusable(false);
        backgroundJLabel.setMaximumSize(null);
        backgroundJLabel.setMinimumSize(null);
        backgroundJLabel.setOpaque(true);
        backgroundJLabel.setPreferredSize(null);
        gridBagConstraints = new java.awt.GridBagConstraints();
        gridBagConstraints.gridx = 0;
        gridBagConstraints.gridy = 0;
        gridBagConstraints.gridheight = 3;
        gridBagConstraints.fill = java.awt.GridBagConstraints.BOTH;
        gridBagConstraints.anchor = java.awt.GridBagConstraints.NORTH;
        gridBagConstraints.weightx = 1.0;
        gridBagConstraints.weighty = 1.0;
        contentJPanel.add(backgroundJLabel, gridBagConstraints);

        getContentPane().add(contentJPanel, java.awt.BorderLayout.CENTER);

        pack();
    }//GEN-END:initComponents

    private void acceptJButtonKeyPressed(java.awt.event.KeyEvent evt) {//GEN-FIRST:event_acceptJButtonKeyPressed
        if( evt.getKeyCode() == java.awt.event.KeyEvent.VK_ENTER )
            acceptJButton.doClick();
    }//GEN-LAST:event_acceptJButtonKeyPressed

    private void acceptJButtonActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_acceptJButtonActionPerformed
        new ConnectThread();
    }//GEN-LAST:event_acceptJButtonActionPerformed

    private void serverJTextFieldActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_serverJTextFieldActionPerformed
        if(acceptJButton.isEnabled())
            acceptJButton.doClick();
    }//GEN-LAST:event_serverJTextFieldActionPerformed

    private void passJPasswordFieldActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_passJPasswordFieldActionPerformed
        if(acceptJButton.isEnabled())
            acceptJButton.doClick();
    }//GEN-LAST:event_passJPasswordFieldActionPerformed

    private void loginJTextFieldActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_loginJTextFieldActionPerformed
        if(acceptJButton.isEnabled())
            acceptJButton.doClick();
    }//GEN-LAST:event_loginJTextFieldActionPerformed


    private void updateAcceptJButtonState(){
        return;
        /*
        if( (loginJTextField.getText().length()>0)
            && (passJPasswordField.getPassword().length>0)
            && (serverJTextField.getText().length()>0))
            acceptJButton.setEnabled(true);
        else
            acceptJButton.setEnabled(false);
         **/
    }



    private void exitForm(java.awt.event.WindowEvent evt) {//GEN-FIRST:event_exitForm
        Util.exit(0);
    }//GEN-LAST:event_exitForm



    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton acceptJButton;
    private javax.swing.JLabel backgroundJLabel;
    private javax.swing.JPanel contentJPanel;
    private javax.swing.JPanel inputJPanel;
    private javax.swing.JLabel loginJLabel;
    private javax.swing.JTextField loginJTextField;
    private javax.swing.JLabel logoLabel;
    private javax.swing.JLabel passJLabel;
    private javax.swing.JPasswordField passJPasswordField;
    private javax.swing.JLabel protocolJLabel;
    private javax.swing.JTextField protocolJTextField;
    private javax.swing.JLabel serverJLabel;
    private javax.swing.JTextField serverJTextField;
    private javax.swing.JProgressBar statusJProgressBar;
    // End of variables declaration//GEN-END:variables

    private class ConnectThread extends Thread {

	private boolean useForce = false;
	
        public ConnectThread(){
	    super("MVCLIENT-ConnectThread");
	    this.setContextClassLoader( Util.getClassLoader() );
	    acceptJButton.setEnabled(false);
	    this.start();
        }
	
	public void run() {
	    
	    // (UPDATE GUI) PREPARE FOR LOGIN
	    try{
		SwingUtilities.invokeAndWait( new Runnable(){ public void run(){
		    loginJTextField.setEnabled(false);
		    passJPasswordField.setEnabled(false);
		    serverJTextField.setEnabled(false);
		    protocolJTextField.setEnabled(false);
		    statusJProgressBar.setValue(0);
		    statusJProgressBar.setIndeterminate(true);
		    statusJProgressBar.setString("Authenticating");
		}});
		Thread.sleep(1000);
	    }
	    catch(Exception e){ /* do nothing on purpose*/  }
	    
	    // ATTEMPT TO LOG IN
	    int retryLogin = 0;
	    while( true ){
		if( Util.getKillThreads() )
		    return;
		retryLogin++;
		try{
		    
		    // LOGIN ///////////
		    MvvmRemoteContext mvvmContext = MvvmRemoteContextFactory.factory().interactiveLogin( Util.getServerCodeBase().getHost(),
													 loginJTextField.getText(),
													 new String(passJPasswordField.getPassword()),
													 0, Util.getClassLoader(),
													 Util.isSecureViaHttps(), useForce );
		    Util.setMvvmContext(mvvmContext);
		    
		    // VERSION MISMATCH ///////
		    String version = Util.getMvvmContext().version();
		    if( !version.equals("-1") ){
			if( !version.equals( Version.getVersion() ) ){
			    resetLogin("Client/Server version mismatch.  Try Restarting.");
			    return;
			}
		    }
		    
		    // EGDEMO ////////////////
		    if( loginJTextField.getText().equals("egdemo") )
			Util.setIsDemo(true);
		    else
			Util.setIsDemo(false);
		    
		    // READOUT SUCCESS /////////////////
		    SwingUtilities.invokeAndWait( new Runnable(){ public void run(){
			statusJProgressBar.setValue(16);
			statusJProgressBar.setIndeterminate(false);
			statusJProgressBar.setString("Successful authentication");
			passJPasswordField.setText("");
		    }});
		    Thread.sleep(2000);
		    retryLogin = -1;
		    break;
		}
		catch(MultipleLoginsException e){
		    String loginName = e.getOtherLogin().getMvvmPrincipal().getName();
		    String loginAddress = e.getOtherLogin().getClientAddr().getHostAddress();
		    StealLoginJDialog stealLoginJDialog = new StealLoginJDialog(loginName, loginAddress);
		    if( stealLoginJDialog.isProceeding() ){
			useForce = true;
			retryLogin = 0;
		    }
		    else{
			resetLogin("Already logged in: " + loginName + " at " + loginAddress);
			retryLogin = -1;
			return;
		    }
		}
		catch(FailedLoginException e){
		    resetLogin("Error: Invalid login/password.");
		    retryLogin = -1;
		    return;
		}
		catch(com.metavize.mvvm.client.InvocationTargetExpiredException e){
		    //e.printStackTrace();
		    //Util.handleExceptionNoRestart("Error:", e);
		}
		catch(com.metavize.mvvm.client.InvocationConnectionException e){
		    //e.printStackTrace();
		    //Util.handleExceptionNoRestart("Error:", e);
		}
		catch(MvvmConnectException e){
		    //e.printStackTrace();
		    //Util.handleExceptionNoRestart("Error:", e);
		}
		catch(Exception e){
		    //e.printStackTrace();
		    //Util.handleExceptionNoRestart("Error:", e);
		}
		finally{
		    if( retryLogin >= Util.LOGIN_RETRY_COUNT ){
			resetLogin("Error: Unable to connect to server.");
			return;
		    }
		    else if( retryLogin > 1 ){
			final int retry = retryLogin;
			SwingUtilities.invokeLater( new Runnable(){ public void run(){
			    statusJProgressBar.setString( "Retrying login..." + " (" + retry + ")" );
			}});
			try{ Thread.currentThread().sleep( Util.LOGIN_RETRY_SLEEP ); }
			catch(Exception e){}
		    }
		}
	    }
	    
	    // ATTEMPT TO LOAD CLIENT
	    int retryClient = 0;
	    while( true ){
		if( Util.getKillThreads() )
		    return;

		retryClient++;
		try{
		    // load GUI with proper context
		    mMainJFrame = new MMainJFrame();
		    Util.setMMainJFrame(mMainJFrame);
		    
		    // (UPDATE GUI) tell the user we are about to see the gui
		    SwingUtilities.invokeAndWait( new Runnable(){ public void run (){
			statusJProgressBar.setString("Showing EdgeGuard client...");
			statusJProgressBar.setValue(100);
		    }});
		    
		    // wait for a little bit
		    Thread.sleep(3000);
		    
		    // (UPDATE GUI) show the main window
		    SwingUtilities.invokeAndWait( new Runnable(){ public void run (){
			MLoginJFrame.this.setVisible(false);
			mMainJFrame.setBounds( Util.generateCenteredBounds(MLoginJFrame.this.getBounds(),
									   mMainJFrame.getWidth(),
									   mMainJFrame.getHeight()) );
			String securedString;
			if( Util.isSecureViaHttps() )
			    securedString = "  |  Connection: https (secure)";
			else
			    securedString = "  |  Connection: http (standard)";
			
			mMainJFrame.setTitle( "Metavize EdgeGuard v" +
					      Version.getVersion() + "  |  Login: " +
					      loginJTextField.getText() + "  |  Server: " +
					      Util.getServerCodeBase().getHost() + securedString );
			if(Util.getIsDemo())
			    mMainJFrame.setTitle( mMainJFrame.getTitle() + "  [DEMO MODE]" );
			mMainJFrame.setExtendedState(Frame.MAXIMIZED_BOTH);
			mMainJFrame.setVisible(true);
		    }});
		    retryClient = -1;
		    break;
		}
		
		catch(com.metavize.mvvm.client.InvocationTargetExpiredException e){
		    Util.handleExceptionNoRestart("Error:", e);
		}
		catch(com.metavize.mvvm.client.InvocationConnectionException e){
		    Util.handleExceptionNoRestart("Error:", e);
		}
		catch(Exception e){
		    Util.handleExceptionNoRestart("Error:", e);
		}
		finally{
		    if(retryClient >= Util.LOGIN_RETRY_COUNT){
			resetLogin("Error: Unable to launch client.");
			reshowLogin();
			return;
		    }
		    else if( retryClient > 1 ){
			final int retry = retryClient;
			SwingUtilities.invokeLater( new Runnable(){ public void run(){
			    statusJProgressBar.setString( "Retrying launch..." + " (" + retry + ")" );
			}});
			try{ Thread.currentThread().sleep( Util.LOGIN_RETRY_SLEEP ); }
			catch(Exception e){}
		    }
		}
	    }
	    
	}
    }
    



}
