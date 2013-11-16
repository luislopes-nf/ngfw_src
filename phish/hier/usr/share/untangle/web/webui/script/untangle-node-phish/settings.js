if (!Ung.hasResource["Ung.Phish"]) {
    Ung.hasResource["Ung.Phish"] = true;
    Ung.NodeWin.registerClassName('untangle-node-phish', 'Ung.Phish');

    Ung.Phish = Ext.extend(Ung.NodeWin, {
        smtpData : null,
        spamData : null,
        emailPanel : null,
        webPanel : null,
        gridWebEventLog : null,
        gridEmailEventLog : null,
        // override get base settings object
        getBaseSettings : function(forceReload) {
            if (forceReload || this.rpc.baseSettings === undefined) {
            	try {
                   this.rpc.baseSettings = this.getRpcNode().getPhishBaseSettings(true);
                } catch (e) {
                Ung.Util.rpcExHandler(e);
            }
            }
            return this.rpc.baseSettings;
        },
        initComponent : function() {
            // keep initial base settings
            this.initialBaseSettings = Ung.Util.clone(this.getBaseSettings());
            // build tabs
            this.buildEmail();
            this.buildWeb();
            this.buildWebEventLog();
            this.buildEmailEventLog();
            // builds the tab panel with the tabs
            this.buildTabPanel([this.emailPanel, this.webPanel, this.gridWebEventLog, this.gridEmailEventLog]);
            Ung.Phish.superclass.initComponent.call(this);
        },
        lookup : function(needle, haystack1, haystack2) {
            for (var i = 0; i < haystack1.length; i++) {
                if (haystack1[i] != undefined && haystack2[i] != undefined) {
                    if (needle == haystack1[i]) {
                        return haystack2[i];
                    }
                    if (needle == haystack2[i]) {
                        return haystack1[i];
                    }
                }
            }
        },
        // Email Config Panel
        buildEmail : function() {
            this.smtpData = [['MARK', this.i18n._('Mark')], ['PASS', this.i18n._('Pass')],
                    ['BLOCK', this.i18n._('Block')], ['QUARANTINE', this.i18n._('Quarantine')]];
            this.spamData = [['MARK', this.i18n._('Mark')], ['PASS', this.i18n._('Pass')]];
            this.emailPanel = new Ext.Panel({
                title : this.i18n._('Email'),
                name : 'Email',
                helpSource : 'email',
                layout : "form",
                autoScroll : true,
                cls: 'ung-panel',
                items : [{
                    xtype : 'fieldset',
                    title : this.i18n._('SMTP'),
                    autoHeight : true,
                    defaults : {
                        width : 210
                    },
                    items : [{
                        xtype : 'checkbox',
                        boxLabel : this.i18n._('Scan SMTP'),
                        name : 'Scan SMTP',
                        hideLabel : true,
                        checked : this.getBaseSettings().smtpConfig.scan,
                        listeners : {
                            "check" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().smtpConfig.scan = newValue;
                                }.createDelegate(this)
                            }
                        }
                    }, {
                        xtype : 'combo',
                        name : 'SMTP Action',
                        editable : false,
                        store : new Ext.data.SimpleStore({
                            fields : ['key', 'name'],
                            data : this.smtpData
                        }),
                        valueField : 'key',
                        displayField : 'name',
                        fieldLabel : this.i18n._('Action'),
                        mode : 'local',
                        triggerAction : 'all',
                        listClass : 'x-combo-list-small',
                        value : this.getBaseSettings().smtpConfig.msgAction,
                        listeners : {
                            "change" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().smtpConfig.msgAction = newValue;
                                }.createDelegate(this)
                            }
                        }
                    }]
                }, {
                    xtype : 'fieldset',
                    title : this.i18n._('POP3'),
                    autoHeight : true,
                    defaults : {
                        width : 210
                    },
                    items : [{
                        xtype : 'checkbox',
                        boxLabel : this.i18n._('Scan POP3'),
                        name : 'Scan POP3',
                        hideLabel : true,
                        checked : this.getBaseSettings().popConfig.scan,
                        listeners : {
                            "check" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().popConfig.scan = newValue;
                                }.createDelegate(this)
                            }
                        }
                    }, {
                        xtype : 'combo',
                        name : 'POP3 Action',
                        editable : false,
                        store : new Ext.data.SimpleStore({
                            fields : ['key', 'name'],
                            data : this.spamData
                        }),
                        valueField : 'key',
                        displayField : 'name',
                        fieldLabel : this.i18n._('Action'),
                        mode : 'local',
                        triggerAction : 'all',
                        listClass : 'x-combo-list-small',
                        value : this.getBaseSettings().popConfig.msgAction,
                        listeners : {
                            "change" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().popConfig.msgAction = newValue;
                                }.createDelegate(this)
                            }
                        }
                    }]
                }, {
                    xtype : 'fieldset',
                    title : this.i18n._('IMAP'),
                    autoHeight : true,
                    defaults : {
                        width : 210
                    },
                    items : [{
                        xtype : 'checkbox',
                        boxLabel : this.i18n._('Scan IMAP'),
                        name : 'Scan IMAP',
                        hideLabel : true,
                        checked : this.getBaseSettings().imapConfig.scan,
                        listeners : {
                            "change" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().imapConfig.scan = newValue;
                                }.createDelegate(this)
                            }
                        }
                    }, {
                        xtype : 'combo',
                        name : 'IMAP Action',
                        editable : false,
                        store : new Ext.data.SimpleStore({
                            fields : ['key', 'name'],
                            data : this.spamData
                        }),
                        valueField : 'key',
                        displayField : 'name',
                        fieldLabel : this.i18n._('Action'),
                        mode : 'local',
                        triggerAction : 'all',
                        listClass : 'x-combo-list-small',
                        value : this.getBaseSettings().imapConfig.msgAction,
                        listeners : {
                            "change" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().imapConfig.msgAction = newValue;
                                }.createDelegate(this)
                            }
                        }
                    }]
                }, {
                    xtype : 'fieldset',
                    title : this.i18n._('Note'),
                    autoHeight : true,
                    cls: 'description',
                    html : this.i18n._('Phish Blocker email signatures were last updated')
                            + ":&nbsp;&nbsp;&nbsp;&nbsp;"
                            + (this.getBaseSettings().lastUpdate != null ? i18n.timestampFormat(this.getBaseSettings().lastUpdate) : i18n
                                    ._("unknown"))
                }]
            });
        },
        // Web Config Panel
        buildWeb : function() {
            this.webPanel = new Ext.Panel({
                title : this.i18n._('Web'),
                helpSource : 'web',
                layout : "form",
                autoScroll : true,
                cls: 'ung-panel',
                items : [{
                    xtype : 'fieldset',
                    autoHeight : true,
                    items : [{
                        xtype : 'checkbox',
                        boxLabel : this.i18n._('Enable Phish web filtering'),
                        name : 'Enable Phish web filtering',
                        hideLabel : true,
                        checked : this.getBaseSettings().enableGooglePhishList,
                        listeners : {
                            "check" : {
                                fn : function(elem, checked) {
                                    this.getBaseSettings().enableGooglePhishList = checked;
                                }.createDelegate(this)
                            }
                        }
                    }]
                }, {
                    xtype : 'fieldset',
                    title : this.i18n._('Note'),
                    autoHeight : true,
                    cls: 'description',
                    html : this.i18n._('Phish Blocker web signatures were last updated ')
                            + ":&nbsp;&nbsp;&nbsp;&nbsp;"
                            + (this.getBaseSettings().lastUpdate != null ? i18n.timestampFormat(this.getBaseSettings().lastUpdate) : i18n
                                    ._("unknown"))
                }]
            });
        },
        // Web Event Log
        buildWebEventLog : function() {
            var asClient = function(value) {
                var pe = (value == null ? null : value.pipelineEndpoints);
                return pe === null ? "" : pe.CClientAddr + ":" + pe.CClientPort;
            };
            var asServer = function(value) {
                var pe = (value == null ? null : value.pipelineEndpoints);
                return pe === null ? "" : pe.SServerAddr + ":" + pe.SServerPort;
            };
            var asRequest = function(value) {
                return value == null || value.url == null ? "" : value.url;
            }.createDelegate(this);
            
            this.gridWebEventLog = new Ung.GridEventLog({
                name : 'Web Event Log',
                helpSource : 'web_event_log',
                settingsCmp : this,
                title : this.i18n._("Web Event Log"),
                eventManagerFn : this.getRpcNode().getPhishHttpEventManager(),
                // the list of fields
                fields : [{
                    name : 'timeStamp',
                    sortType : Ung.SortTypes.asTimestamp
                }, {
                    name : 'displayAction',
                    mapping : 'actionType',
                    type : 'string',
                    convert : function(value) {
                        switch (value) {
                            case 0 : // PASSED
                                return this.i18n._("pass");
                            default :
                            case 1 : // BLOCKED
                                return this.i18n._("block");
                        }
                    }.createDelegate(this)
                }, {
                    name : 'client',
                    mapping : 'requestLine',
                    sortType : asClient
                }, {
                    name : 'server',
                    mapping : 'requestLine',
                    sortType : asServer
                }, {
                    name : 'request',
                    mapping : 'requestLine',
                    sortType : asRequest
                }],
                // the list of columns
                columns : [{
                    header : this.i18n._("timestamp"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'timeStamp',
                    renderer : function(value) {
                        return i18n.timestampFormat(value);
                    }
                }, {
                    header : this.i18n._("action"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'displayAction'
                }, {
                    header : this.i18n._("client"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'client',
                    renderer : asClient
                }, {
                    header : this.i18n._("request"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'request',
                    renderer : asRequest
                }, {
                    header : this.i18n._("server"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'server',
                    renderer : asServer
                }]
            });
        },
        // Email Event Log
        buildEmailEventLog : function() {
            this.gridEmailEventLog = new Ung.GridEventLog({
                name : 'Email Event Log',
                helpSource : 'email_event_log',
                settingsCmp : this,
                title : this.i18n._("Email Event Log"),
                // the list of fields
                fields : [{
                    name : 'timeStamp',
                    sortType : Ung.SortTypes.asTimestamp
                }, {
                    name : 'displayAction',
                    mapping : 'actionType',
                    type : 'string',
                    convert : function(value, rec ) {
                        switch (rec.type) {
                            case 'POP/IMAP' :
                                switch (value) {
                                    case 0 : // PASSED
                                        return this.i18n._("pass message");
                                    default :
                                    case 1 : // MARKED
                                        return this.i18n._("mark infection");
                                }
                                break;
                            case 'SMTP' :
                                switch (value) {
                                    default :
                                    case 0 : // PASSED
                                        return this.i18n._("pass message");
                                    case 1 : // MARKED
                                        return this.i18n._("mark infection");
                                    case 2 : // BLOCKED
                                        return this.i18n._("block message");
                                    case 3 : // QUARANTINED
                                        return this.i18n._("quarantine message");
                                    case 4 : // SAFELISTED
                                        return this.i18n._("safelist message");
                                    case 5 : // OVERSIZE
                                        return this.i18n._("oversize message");
                                }
                                break;
                        }
                        return "";
                    }.createDelegate(this)
                }, {
                    name : 'client',
                    mapping : 'clientAddr',
                    convert : function(value, rec ) {
                        return value === null ? "" : rec.clientAddr + ":" + rec.clientPort;
                    }
                }, {
                    name : 'server',
                    mapping : 'serverAddr',
                    convert : function(value, rec ) {
                        return value === null ? "" : rec.serverAddr + ":" + rec.serverPort;
                    }
                }, {
                    name : 'subject',
                    type : 'string'
                }, {
                    name : 'receiver',
                    type : 'string'
                }, {
                    name : 'sender',
                    type : 'string'
                }],
                // the list of columns
                columns : [{
                    header : this.i18n._("timestamp"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'timeStamp',
                    renderer : function(value) {
                        return i18n.timestampFormat(value);
                    }
                }, {
                    header : this.i18n._("action"),
                    width : 90,
                    sortable : true,
                    dataIndex : 'displayAction'
                }, {
                    header : this.i18n._("client"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'client'
                }, {
                    header : this.i18n._("subject"),
                    width : 90,
                    sortable : true,
                    dataIndex : 'subject'
                }, {
                    header : this.i18n._("receiver"),
                    width : 90,
                    sortable : true,
                    dataIndex : 'receiver'
                }, {
                    header : this.i18n._("sender"),
                    width : 90,
                    sortable : true,
                    dataIndex : 'sender'
                }, {
                    header : this.i18n._("server"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'server'
                }]
            });
        },

        // save function
        saveAction : function() {
            Ext.MessageBox.wait(i18n._("Saving..."), i18n._("Please wait"));
            this.getRpcNode().setPhishBaseSettings(function(result, exception) {
                Ext.MessageBox.hide();
                if(Ung.Util.handleException(exception)) return;
                // exit settings screen
                this.closeWindow();
            }.createDelegate(this), this.getBaseSettings());
        },
        isDirty : function() {
            return !Ung.Util.equals(this.getBaseSettings(), this.initialBaseSettings);
        }
    });
}