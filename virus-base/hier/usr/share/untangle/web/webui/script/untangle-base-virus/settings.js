if (!Ung.hasResource["Ung.Virus"]) {
    Ung.hasResource["Ung.Virus"] = true;
    Ung.NodeWin.registerClassName('untangle-base-virus', 'Ung.Virus');

    Ung.Virus = Ext.extend(Ung.NodeWin, {
    	panelWeb:null,
    	panelEmail: null,
    	panelFtp: null,
        gridEventLog : null,
        // override get base settings object to reload the signature information.
        getBaseSettings : function(forceReload) {
            if (forceReload || this.rpc.baseSettings === undefined) {
                try {
                    this.rpc.baseSettings = this.getRpcNode().getBaseSettings(true);
                } catch (e) {
                    Ung.Util.rpcExHandler(e);
                }
            }
            return this.rpc.baseSettings;
        },
        // called when the component is rendered
        initComponent : function() {
            // keep initial base settings
            this.initialBaseSettings = Ung.Util.clone(this.getBaseSettings());
            
            this.buildWeb();
            this.buildEmail();
            this.buildFtp();
            this.buildEventLog();
            // builds the tab panel with the tabs
            this.buildTabPanel([this.panelWeb, this.panelEmail, this.panelFtp, this.gridEventLog]);
            Ung.Virus.superclass.initComponent.call(this);
        },
        // Web Panel
        buildWeb : function() {
            this.panelWeb = new Ext.Panel({
                name : 'Web',
                helpSource : 'web',
                // private fields
                winExtensions : null,
                winMimeTypes : null,
                parentId : this.getId(),

                title : this.i18n._('Web'),
                layout : "form",
                cls: 'ung-panel',
                autoScroll : true,
                defaults : {
                    xtype : 'fieldset',
                    autoHeight : true,
                    buttonAlign : 'left'
                },
                items : [{
                    items : [{
                        xtype : 'checkbox',
                        boxLabel : this.i18n._('Scan HTTP'),
                        hideLabel : true,
                        name : 'Scan HTTP',
                        checked : this.getBaseSettings().httpConfig.scan,
                        listeners : {
                            "check" : {
                                fn : function(elem, checked) {
                                    this.getBaseSettings().httpConfig.scan = checked;
                                }.createDelegate(this)
                            }
                        }
                    }]
                }, {
                	title: this.i18n._('Advanced Settings'),
                    collapsible: true,
                	collapsed: true,
                	labelWidth: 170,
                    items : [{
                        xtype : 'button',
                        name : 'File Extensions',
                        text : this.i18n._('File Extensions'),
                        style : 'padding-bottom:10px;',
                        handler : function() {
                            this.panelWeb.onManageExtensions();
                        }.createDelegate(this)
                    }, {
                        xtype : 'button',
                        name : 'MIME Types',
                        text : this.i18n._('MIME Types'),
                        style : 'padding-bottom:10px;',
                        handler : function() {
                            this.panelWeb.onManageMimeTypes();
                        }.createDelegate(this)
                    }, {
                        xtype : 'checkbox',
                        boxLabel : this.i18n._('Disable HTTP Resume'),
                        hideLabel : true,
                        name : 'Disable HTTP Resume',
                        checked : this.getBaseSettings().httpDisableResume,
                        listeners : {
                            "check" : {
                                fn : function(elem, checked) {
                                    this.getBaseSettings().httpDisableResume = checked;
                                }.createDelegate(this)
                            }
                        }
                    },{
                        xtype : 'numberfield',
                        fieldLabel : this.i18n._('Scan trickle rate (1-99)'),
                        name : 'Scan trickle rate',
                        id: 'virus_http_trickle_percent',
                        value : this.getBaseSettings().tricklePercent,
                        width: 25,
                        allowDecimals: false,
                        allowNegative: false,
                        minValue: 1,                        
                        maxValue: 99,
                        listeners : {
                            "change" : {
                                fn : function(elem, newValue) {
                    	            var tricklePercentFtpCmp = Ext.getCmp('virus_ftp_trickle_percent');
                    	            tricklePercentFtpCmp.setValue(newValue);
                                    this.getBaseSettings().tricklePercent = newValue;
                                }.createDelegate(this)
                            }
                        }
                    }]
                }, {
                	cls: 'description',
                    html : this.i18n._("Virus Blocker signatures were last updated") + ":&nbsp;&nbsp;&nbsp;&nbsp;"
                            + ((this.getBaseSettings().lastUpdate != null) ? i18n.timestampFormat(this.getBaseSettings().lastUpdate) : 
                            this.i18n._("Unknown"))
                }],

                onManageExtensions : function() {
                    if (!this.winExtensions) {
                        var settingsCmp = Ext.getCmp(this.parentId);
                        settingsCmp.buildExtensions();
                        this.winExtensions = new Ung.ManageListWindow({
                            breadcrumbs : [{
                                title : i18n._(rpc.currentPolicy.name),
                                action : function() {
                                    Ung.Window.cancelAction(
                                       this.gridExtensions.isDirty() || this.isDirty(),
                                       function() {
                                            this.panelWeb.winExtensions.closeWindow();
                                            this.closeWindow();
                                       }.createDelegate(this)
                                    );
                                }.createDelegate(settingsCmp)
                            }, {
                                title : settingsCmp.node.md.displayName,
                                action : function() {
                                    this.panelWeb.winExtensions.cancelAction();
                                }.createDelegate(settingsCmp)
                            }, {
                                title : settingsCmp.i18n._("Web"),
                                action : function() {
                                    this.panelWeb.winExtensions.cancelAction();
                                }.createDelegate(settingsCmp)
                            }, {
                                title : settingsCmp.i18n._("File Extensions")
                            }],
                            grid : settingsCmp.gridExtensions
                        });
                    }
                    this.winExtensions.show();
                },
                onManageMimeTypes : function() {
                    if (!this.winMimeTypes) {
                        var settingsCmp = Ext.getCmp(this.parentId);
                        settingsCmp.buildMimeTypes();
                        this.winMimeTypes = new Ung.ManageListWindow({
                            breadcrumbs : [{
                                title : i18n._(rpc.currentPolicy.name),
                                action : function() {
                                    Ung.Window.cancelAction(
                                       this.gridMimeTypes.isDirty() || this.isDirty(),
                                       function() {
                                            this.panelWeb.winMimeTypes.closeWindow();
                                            this.closeWindow();
                                       }.createDelegate(this)
                                    );
                                }.createDelegate(settingsCmp)
                            }, {
                                title : settingsCmp.node.md.displayName,
                                action : function() {
                                    this.panelWeb.winMimeTypes.cancelAction();
                                }.createDelegate(settingsCmp)
                            }, {
                                title : settingsCmp.i18n._("Web"),
                                action : function() {
                                    this.panelWeb.winMimeTypes.cancelAction();
                                }.createDelegate(settingsCmp)
                            }, {
                                title : settingsCmp.i18n._("MIME Types")
                            }],
                            grid : settingsCmp.gridMimeTypes
                        });
                    }
                    this.winMimeTypes.show();
                },
                beforeDestroy : function() {
                    Ext.destroy( this.winExtensions, this.winMimeTypes);
                    Ext.Panel.prototype.beforeDestroy.call(this);
                }
            });
        },
        // File Types
        buildExtensions : function() {
            var liveColumn = new Ext.grid.CheckColumn({
                header : this.i18n._("scan"),
                dataIndex : 'live',
                fixed : true
            });

            this.gridExtensions = new Ung.EditorGrid({
                name : 'File Extensions',
                settingsCmp : this,
                totalRecords : this.getBaseSettings().extensionsLength,
                emptyRow : {
                    "string" : "undefined type",
                    "live" : true,
                    "name" : this.i18n._("[no description]")
                },
                title : this.i18n._("File Extensions"),
                recordJavaClass : "com.untangle.uvm.node.StringRule",
                proxyRpcFn : this.getRpcNode().getExtensions,
                fields : [{
                    name : 'id'
                }, {
                    name : 'string',
                    type : 'string'
                }, {
                    name : 'live'
                }, {
                    name : 'name',
                    type : 'string'
                }],
                columns : [{
                    id : 'string',
                    header : this.i18n._("file type"),
                    width : 200,
                    dataIndex : 'string',
                    editor : new Ext.form.TextField({
                        allowBlank : false
                    })
                }, liveColumn, {
                    id : 'name',
                    header : this.i18n._("description"),
                    width : 200,
                    dataIndex : 'name',
                    editor : new Ext.form.TextField({
                        allowBlank : false
                    })
                }],
                sortField : 'string',
                columnsDefaultSortable : true,
                autoExpandColumn : 'name',
                plugins : [liveColumn],
                rowEditorInputLines : [new Ext.form.TextField({
                    name : "File Type",
                    dataIndex : "string",
                    fieldLabel : this.i18n._("File Type"),
                    allowBlank : false,
                    width : 200
                }), new Ext.form.Checkbox({
                    name : "Scan",
                    dataIndex : "live",
                    fieldLabel : this.i18n._("Scan")
                }), new Ext.form.TextArea({
                    name : "Description",
                    dataIndex : "name",
                    fieldLabel : this.i18n._("Description"),
                    width : 200,
                    height : 60
                })]
            });
        },
        // MIME Types
        buildMimeTypes : function() {
            var liveColumn = new Ext.grid.CheckColumn({
                header : this.i18n._("scan"),
                dataIndex : 'live',
                fixed : true
            });

            this.gridMimeTypes = new Ung.EditorGrid({
                name : 'MIME Types',
                settingsCmp : this,
                totalRecords : this.getBaseSettings().httpMimeTypesLength,
                emptyRow : {
                    "mimeType" : "undefined type",
                    "live" : true,
                    "name" : this.i18n._("[no description]")
                },
                title : this.i18n._("MIME Types"),
                recordJavaClass : "com.untangle.uvm.node.MimeTypeRule",
                proxyRpcFn : this.getRpcNode().getHttpMimeTypes,
                fields : [{
                    name : 'id'
                }, {
                    name : 'mimeType',
                    type : 'string'
                }, {
                    name : 'live'
                }, {
                    name : 'name',
                    type : 'string'
                }],
                columns : [{
                    id : 'mimeType',
                    header : this.i18n._("MIME type"),
                    width : 200,
                    dataIndex : 'mimeType',
                    editor : new Ext.form.TextField({
                        allowBlank : false
                    })
                }, liveColumn, {
                    id : 'name',
                    header : this.i18n._("description"),
                    width : 200,
                    dataIndex : 'name',
                    editor : new Ext.form.TextField({
                        allowBlank : false
                    })
                }],
                sortField : 'mimeType',
                columnsDefaultSortable : true,
                autoExpandColumn : 'name',
                plugins : [liveColumn],
                rowEditorInputLines : [new Ext.form.TextField({
                    name : "MIME Type",
                    dataIndex : "mimeType",
                    fieldLabel : this.i18n._("MIME Type"),
                    allowBlank : false,
                    width : 200
                }), new Ext.form.Checkbox({
                    name : "Scan",
                    dataIndex : "live",
                    fieldLabel : this.i18n._("Scan")
                }), new Ext.form.TextArea({
                    name : "Description",
                    dataIndex : "name",
                    fieldLabel : this.i18n._("Description"),
                    width : 200,
                    height : 60
                })]
            });
        },        
        // Ftp Panel
        buildFtp : function() {
            this.panelFtp = new Ext.Panel({
                name : 'FTP',
                helpSource : 'ftp',
                // private fields
                parentId : this.getId(),

                title : this.i18n._('FTP'),
                layout : "form",
                cls: 'ung-panel',
                autoScroll : true,
                defaults : {
                    xtype : 'fieldset',
                    autoHeight : true,
                    buttonAlign : 'left'
                },
                items : [{
                    items : [{
                        xtype : 'checkbox',
                        boxLabel : this.i18n._('Scan FTP'),
                        hideLabel : true,
                        name : 'Scan FTP',
                        checked : this.getBaseSettings().ftpConfig.scan,
                        listeners : {
                            "check" : {
                                fn : function(elem, checked) {
                                    this.getBaseSettings().ftpConfig.scan = checked;
                                }.createDelegate(this)
                            }
                        }
                    }]
                }, {
                    title: this.i18n._('Advanced Settings'),
                    collapsible: true,
                    collapsed: true,
                    labelWidth: 170,
                    items : [{
                        xtype : 'checkbox',
                        boxLabel : this.i18n._('Disable FTP Resume'),
                        hideLabel : true,
                        name : 'Disable FTP Resume',
                        checked : this.getBaseSettings().ftpDisableResume,
                        listeners : {
                            "check" : {
                                fn : function(elem, checked) {
                                    this.getBaseSettings().ftpDisableResume = checked;
                                }.createDelegate(this)
                            }
                        }
                    },{
                        xtype : 'numberfield',
                        fieldLabel : this.i18n._('Scan trickle rate'),
                        name : 'Scan trickle rate (1-99)',
                        id: 'virus_ftp_trickle_percent',
                        value : this.getBaseSettings().tricklePercent,
                        width: 25,
                        allowDecimals: false,
                        allowNegative: false,
                        minValue: 1,                        
                        maxValue: 99,
                        listeners : {
                            "change" : {
                                fn : function(elem, newValue) {
                                    var tricklePercentHttpCmp = Ext.getCmp('virus_http_trickle_percent');
									tricklePercentHttpCmp.setValue(newValue);
									this.getBaseSettings().tricklePercent = newValue;
                                }.createDelegate(this)
                            }
                        }
                    }]
                }, {
                	cls: 'description',
                    html : this.i18n._("Virus Blocker signatures were last updated") + ":&nbsp;&nbsp;&nbsp;&nbsp;"
                            + ((this.getBaseSettings().lastUpdate != null) ? i18n.timestampFormat(this.getBaseSettings().lastUpdate) : 
                            this.i18n._("Unknown"))
                }]

            });
        },
        // Email Panel
        buildEmail : function() {
            this.panelEmail = new Ext.Panel({
                name : 'Email',
                helpSource : 'email',
                // private fields
                parentId : this.getId(),

                title : this.i18n._('Email'),
                layout : "anchor",
                defaults: {
                	anchor: '98%',
                    xtype : 'fieldset',
                    autoHeight : true,
                	autoScroll: true,
                    buttonAlign : 'left'
                },
                cls: 'ung-panel',
                autoScroll : true,
                items : [{
                	layout:'column',
                    items:[{
                        columnWidth:.3,
                        layout: 'form',
                        border:false,
                        items: [{
                            xtype : 'checkbox',
                            boxLabel : this.i18n._('Scan SMTP'),
                            hideLabel : true,
                            name : 'Scan SMTP',
                            checked : this.getBaseSettings().smtpConfig.scan,
                            listeners : {
                                "check" : {
                                    fn : function(elem, checked) {
                                        this.getBaseSettings().smtpConfig.scan = checked;
                                    }.createDelegate(this)
                                }
                            }
                        }, {
                            xtype : 'checkbox',
                            boxLabel : this.i18n._('Scan POP3'),
                            hideLabel : true,
                            name : 'Scan POP3',
                            checked : this.getBaseSettings().popConfig.scan,
                            listeners : {
                                "check" : {
                                    fn : function(elem, checked) {
                                        this.getBaseSettings().popConfig.scan = checked;
                                    }.createDelegate(this)
                                }
                            }
                        }, {
                            xtype : 'checkbox',
                            boxLabel : this.i18n._('Scan IMAP'),
                            hideLabel : true,
                            name : 'Scan IMAP',
                            checked : this.getBaseSettings().imapConfig.scan,
                            listeners : {
                                "check" : {
                                    fn : function(elem, checked) {
                                        this.getBaseSettings().imapConfig.scan = checked;
                                    }.createDelegate(this)
                                }
                            }
                        }]
                    },{
                        columnWidth:.7,
                        layout: 'form',
                        border:false,
                        items: [{
                            xtype : 'combo',
                            name : 'SMTP Action',
                            editable : false,
                            fieldLabel : this.i18n._('Action'),
                            mode : 'local',
                            triggerAction : 'all',
                            listClass : 'x-combo-list-small',
                            store : new Ext.data.SimpleStore({
                                fields : ['key', 'name'],
                                data : [["PASS", this.i18n._("pass message")], 
                                        ["REMOVE", this.i18n._("remove infection")],
                                        ["BLOCK", this.i18n._("block message")]]
                            }),
                            displayField : 'name',
                            valueField : 'key',
                            value : this.getBaseSettings().smtpConfig.msgAction,
                            listeners : {
                                "change" : {
                                    fn : function(elem, newValue) {
                                        this.getBaseSettings().smtpConfig.msgAction = newValue;
                                    }.createDelegate(this)
                                }
                            }
                        },{
                            xtype : 'combo',
                            name : 'POP3 Action',
                            editable : false,
                            fieldLabel : this.i18n._('Action'),
                            mode : 'local',
                            triggerAction : 'all',
                            listClass : 'x-combo-list-small',
                            store : new Ext.data.SimpleStore({
                                fields : ['key', 'name'],
                                data : [["PASS", this.i18n._("pass message")], 
                                        ["REMOVE", this.i18n._("remove infection")]]
                            }),
                            displayField : 'name',
                            valueField : 'key',
                            value : this.getBaseSettings().popConfig.msgAction,
                            listeners : {
                                "change" : {
                                    fn : function(elem, newValue) {
                                        this.getBaseSettings().popConfig.msgAction = newValue;
                                    }.createDelegate(this)
                                }
                            }
                        },{
                            xtype : 'combo',
                            name : 'IMAP Action',
                            editable : false,
                            fieldLabel : this.i18n._('Action'),
                            mode : 'local',
                            triggerAction : 'all',
                            listClass : 'x-combo-list-small',
                            store : new Ext.data.SimpleStore({
                                fields : ['key', 'name'],
                                data : [["PASS", this.i18n._("pass message")], 
                                        ["REMOVE", this.i18n._("remove infection")]]
                            }),
                            displayField : 'name',
                            valueField : 'key',
                            value : this.getBaseSettings().imapConfig.msgAction,
                            listeners : {
                                "change" : {
                                    fn : function(elem, newValue) {
                                        this.getBaseSettings().imapConfig.msgAction = newValue;
                                    }.createDelegate(this)
                                }
                            }
                        }]
                    }]
                }, {
                	cls: 'description',
                    html : this.i18n._("Virus Blocker signatures were last updated") + ":&nbsp;&nbsp;&nbsp;&nbsp;"
                            + ((this.getBaseSettings().lastUpdate != null) ? i18n.timestampFormat(this.getBaseSettings().lastUpdate) : 
                            this.i18n._("Unknown"))
                }]

            });
        },
        // Event Log
        buildEventLog : function() {
            this.gridEventLog = new Ung.GridEventLog({
                settingsCmp : this,
                //autoExpandColumn: 'timeStamp',

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
                            case 'HTTP' :
                            case 'FTP' :
                                switch (value) {
                                    case 0 : // PASSED
                                        return this.i18n._("clean");
                                    case 1 : // CLEANED
                                        return this.i18n._("cleaned");
                                    default :
                                    case 2 : // BLOCKED
                                        return this.i18n._("blocked");
                                }
                                break;
                            case 'POP/IMAP' :
                                switch (value) {
                                    case 0 : // PASSED
                                        return this.i18n._("pass message");
                                    default :
                                    case 1 : // CLEANED
                                        return this.i18n._("remove infection");
                                }
                                break;
                            case 'SMTP' :
                                switch (value) {
                                    case 0 : // PASSED
                                        return this.i18n._("pass message");
                                    case 1 : // CLEANED
                                        return this.i18n._("remove infection");
                                    default :
                                    case 2 : // BLOCKED
                                        return this.i18n._("block message");
                                }
                                break;
                        }
                        return "";
                    }.createDelegate(this)
                }, {
                    name : 'client',
                    mapping : 'pipelineEndpoints',
                    sortType : Ung.SortTypes.asClient
                }, {
                    name : 'server',
                    mapping : 'pipelineEndpoints',
                    sortType : Ung.SortTypes.asServer
                }, {
                    name : 'traffic',
                    type : 'string'
                }, {
                    name : 'reason',
                    mapping : 'infected',
                    type : 'string',
                    convert : function(value) {
                        return value ? this.i18n._("virus found") : this.i18n._("no virus found");
                    }.createDelegate(this)
                }],
                // the list of columns
                columns : [{
                    header : this.i18n._("timestamp"),
                    width : 130,
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
                    renderer : Ung.SortTypes.asClient
                }, {
                    id: 'traffic',
                    header : this.i18n._("traffic"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'traffic'
                }, {
                    header : this.i18n._("reason for action"),
                    width : 140,
                    sortable : true,
                    dataIndex : 'reason'
                }, {
                    header : this.i18n._("server"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'server',
                    renderer : Ung.SortTypes.asServer
                }],
                autoExpandColumn: 'traffic'
            });
        },
        // validation function
		validateClient : function() {
			//validate trickle rate
            var tricklePercentCmp = Ext.getCmp('virus_http_trickle_percent');
            if (tricklePercentCmp.isValid()) {
				return true;
			} else {
				Ext.MessageBox.alert(this.i18n._('Warning'), this.i18n._("Scan trickle rate should be between 1 and 99!"),
                    function () {
                        this.tabs.activate(this.panelWeb);
                        tricklePercentCmp.focus(true);
                    }.createDelegate(this) 
				);
                return false;
            }
		},
        // save function
        saveAction : function() {
            if (this.validate()) {
                Ext.MessageBox.wait(i18n._("Saving..."), i18n._("Please wait"));
                this.getRpcNode().updateAll(function(result, exception) {
                    Ext.MessageBox.hide();
                    if(Ung.Util.handleException(exception)) return;
                    // exit settings screen
                    this.closeWindow();
                }.createDelegate(this), this.getBaseSettings(), 
                        this.gridMimeTypes ? this.gridMimeTypes.getSaveList() : null,
                        this.gridExtensions ? this.gridExtensions.getSaveList() : null);
            }
        },
        isDirty : function() {
            return !Ung.Util.equals(this.getBaseSettings(), this.initialBaseSettings)
                || (this.gridMimeTypes ? this.gridMimeTypes.isDirty() : false)
                || (this.gridExtensions ? this.gridExtensions.isDirty() : false);
        }
    });
}