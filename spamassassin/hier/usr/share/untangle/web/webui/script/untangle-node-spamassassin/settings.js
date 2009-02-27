if (!Ung.hasResource["Ung.SpamAssassin"]) {
    Ung.hasResource["Ung.SpamAssassin"] = true;
    Ung.NodeWin.registerClassName('untangle-node-spamassassin', 'Ung.SpamAssassin');

    Ung.SpamAssassin = Ext.extend(Ung.NodeWin, {
        strengthsData : null,
        smtpData : null,
        spamData : null,
        emailPanel : null,
        gridEventLog : null,
        gridRBLEventLog : null,
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
        initComponent : function() {
            // keep initial base settings
            this.initialBaseSettings = Ung.Util.clone(this.getBaseSettings());

            this.buildEmail();
            this.buildEventLog();
            this.buildRBLEventLog();
            // builds the tab panel with the tabs
            this.buildTabPanel([this.emailPanel, this.gridEventLog, this.gridRBLEventLog]);
            this.tabs.activate(this.emailPanel);
            Ung.SpamAssassin.superclass.initComponent.call(this);
        },
        // called when the component is rendered
        onRender : function(container, position) {
            // call superclass renderer first
            Ung.SpamAssassin.superclass.onRender.call(this, container, position);
            this.initSubCmps.defer(1, this);
            this.enableSuperSpam(Ext.getCmp('spamassassin_smtpAction'));
        },
        initSubCmps : function() {
            Ext.getCmp('spamassassin_smtpStrengthValue').setContainerVisible(this.isCustomStrength(this.getBaseSettings().smtpConfig.strength));
            Ext.getCmp('spamassassin_pop3StrengthValue').setContainerVisible(this.isCustomStrength(this.getBaseSettings().popConfig.strength));
            Ext.getCmp('spamassassin_imapStrengthValue').setContainerVisible(this.isCustomStrength(this.getBaseSettings().imapConfig.strength));
        },
        isCustomStrength : function(strength) {
            return !(strength == 50 || strength == 43 || strength == 35 || strength == 33 || strength == 30)
        },
        getStrengthSelectionValue : function(strength) {
            if (this.isCustomStrength(strength)) {
                return 0;
            } else {
                return strength;
            }
        },
        //enable super spam if quarantine is selected from the drop down
        enableSuperSpam: function(elem){
            var dsfq = Ext.getCmp('drop-spam-from-quarantine');
            var ssv = Ext.getCmp('spamassassin_smtpSuperStrengthValue');
            var newValue = elem.getValue();
            if(elem.disabled==true){
                dsfq.disable();
                ssv.disable();
            }else if(newValue == 'QUARANTINE'){
                dsfq.enable();
                if(dsfq.getValue()){
                   ssv.enable();
                }else{
                   ssv.enable();
                }
            }else{
                dsfq.disable();
                ssv.disable();
            }
            //Ext does not gray out the label of a textfield!
            if(ssv.disabled){
                ssv.fireEvent('disable');
            }else{
                ssv.fireEvent('enable');
            }
        },
        // Email Config Panel
        buildEmail : function() {
            this.smtpData = [['MARK', this.i18n._('Mark')], ['PASS', this.i18n._('Pass')],
                    ['BLOCK', this.i18n._('Block')], ['QUARANTINE', this.i18n._('Quarantine')]];
            this.spamData = [['MARK', this.i18n._('Mark')], ['PASS', this.i18n._('Pass')]];
            this.strengthsData = [[50, this.i18n._('Low (Strength: 5.0)')], [43, this.i18n._('Medium (Strength: 4.3)')], [35, this.i18n._('High (Strength: 3.5)')],
                    [33, this.i18n._('Very High (Strength: 3.3)')], [30, this.i18n._('Extreme (Strength: 3.0)')], [0, this.i18n._('Custom')]];

            this.emailPanel = new Ext.Panel({
                title : this.i18n._('Email'),
                name : 'Email',
                helpSource : 'email',
                layout : "anchor",
                defaults: {
                    anchor: '98%',
                    autoScroll: true
                },
                autoScroll : true,
                cls: 'ung-panel',
                items : [{
                    xtype : 'fieldset',
                    title : this.i18n._('SMTP'),
                    autoHeight : true,
                    //labelWidth: 110,
                    items : [{
                        xtype : 'checkbox',
                        name : 'Scan SMTP',
                        boxLabel : this.i18n._('Scan SMTP'),
                        hideLabel : true,
                        checked : this.getBaseSettings().smtpConfig.scan,
                        listeners : {
                            "check" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().smtpConfig.scan = newValue;
                                    if(elem.getValue()){
                                        Ext.getCmp('spamassassin_smtpStrength').enable();
                                        Ext.getCmp('spamassassin_smtpAction').enable();

                                    }else{
                                        Ext.getCmp('spamassassin_smtpStrength').disable();
                                        Ext.getCmp('spamassassin_smtpAction').disable();
                                    }
                                    this.enableSuperSpam(Ext.getCmp('spamassassin_smtpAction'));
                                }.createDelegate(this)
                            },
                            "render":{
                                    fn : function(elem) {
                                        if(elem.getValue()){
                                            Ext.getCmp('spamassassin_smtpStrength').enable();
                                            Ext.getCmp('spamassassin_smtpAction').enable();

                                        }else{
                                            Ext.getCmp('spamassassin_smtpStrength').disable();
                                            Ext.getCmp('spamassassin_smtpAction').disable();
                                        }
                                        this.enableSuperSpam(Ext.getCmp('spamassassin_smtpAction'))

                                    }.createDelegate(this)
                            }
                        }
                    }, {
                        border: false,
                        layout:'column',
                        autoWidth : true,
                        items: [{
                            border: false,
                            columnWidth:.6,
                            layout: 'form',

                            items: [{
                                xtype : 'combo',
                                name : 'SMTP Strength',
                                id :'spamassassin_smtpStrength',
                                editable : false,
                                itemCls : 'left-indent-1',
                                store : this.strengthsData,
                                fieldLabel : this.i18n._('Strength'),
                                width : 200,
                                mode : 'local',
                                triggerAction : 'all',
                                listClass : 'x-combo-list-small',
                                value : this.getStrengthSelectionValue(this.getBaseSettings().smtpConfig.strength),
                                listeners : {
                                    "select" : {
                                        fn : function(elem, record) {
                                            var customCmp = Ext.getCmp('spamassassin_smtpStrengthValue');
                                            if (record.data.value == 0) {
                                                customCmp.showContainer();
                                            } else {
                                                customCmp.hideContainer();
                                                this.getBaseSettings().smtpConfig.strength = record.data.value;
                                            }
                                            customCmp.setValue(this.getBaseSettings().smtpConfig.strength / 10.0);
                                        }.createDelegate(this)
                                    }
                                }
                            }]
                        },{
                            border: false,
                            columnWidth:.4,
                            layout: 'form',
                            items: [{
                                xtype : 'numberfield',
                                fieldLabel : this.i18n._('Strength Value'),
                                name : 'SMTP Strength Value',
                                id: 'spamassassin_smtpStrengthValue',
                                itemCls : 'left-indent-1',
                                value : this.getBaseSettings().smtpConfig.strength / 10.0,
                                width : 100,
                                allowDecimals: true,
                                allowBlank : false,
                                blankText : this.i18n._('Strength Value must be a number. Smaller value is higher strength.'),
                                minValue : -2147483648,
                                maxValue : 2147483647,
                                listeners : {
                                    "change" : {
                                        fn : function(elem, newValue) {
                                          this.getBaseSettings().smtpConfig.strength = Math.round(newValue * 10);
                                        }.createDelegate(this)
                                    }
                                }
                            }]
                        }]
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
                        id :'spamassassin_smtpAction',
                        fieldLabel : this.i18n._('Action'),
                        itemCls : 'left-indent-1',
                        width : 200,
                        mode : 'local',
                        triggerAction : 'all',
                        listClass : 'x-combo-list-small',
                        value : this.getBaseSettings().smtpConfig.msgAction,
                        listeners : {
                            "change" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().smtpConfig.msgAction = newValue;
                                }.createDelegate(this)
                            },
                            "render" : {
                                fn : function(elem){
                                    this.enableSuperSpam(elem);
                                }.createDelegate(this)
                            },
                            "select" :{
                                fn : function(elem){
                                    this.enableSuperSpam(elem);
                                }.createDelegate(this)
                            }
                        }
                    }, {
                        xtype : 'checkbox',
                        name : 'Enable Super Spam Blocking',
                        id : 'drop-spam-from-quarantine',
                        boxLabel : this.i18n._('Drop Super Spam from Quarantine'),
                        hideLabel : true,
                        itemCls : 'left-indent-4',
                        checked : this.getBaseSettings().smtpConfig.blockSuperSpam,
                        listeners : {
                            "render" : {
                                fn : function(elem) {
                                        if(elem.getValue()){
                                        Ext.getCmp('spamassassin_smtpSuperStrengthValue').enable();
                                    }else{
                                        Ext.getCmp('spamassassin_smtpSuperStrengthValue').disable();
                                    }
                                }.createDelegate(this)
                            },
                            "check" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().smtpConfig.blockSuperSpam = newValue;
                                    if(newValue){
                                        Ext.getCmp('spamassassin_smtpSuperStrengthValue').enable();
                                    }else{
                                        Ext.getCmp('spamassassin_smtpSuperStrengthValue').disable();
                                    }
                                }.createDelegate(this)
                            }
                        }
                    },
                    {
                      xtype : 'numberfield',
                      labelWidth: 150,
                      fieldLabel : this.i18n._('Super Spam Threshold'),
                      name : 'Super Spam Level',
                      id: 'spamassassin_smtpSuperStrengthValue',
                      value : this.getBaseSettings().smtpConfig.superSpamStrength / 10.0,
                      allowDecimals: false,
                      allowNegative: false,
                      minValue: 0,
                      itemCls : 'left-indent-4 super-spam-threshold x-item-disabled',
                      maxValue: 2147483647,
                      listeners : {
                        "change" : {
                          fn : function(elem, newValue) {
                            this.getBaseSettings().smtpConfig.superSpamStrength = Math.round(newValue * 10);
                          }.createDelegate(this)
                        },
                        "disable" :{
                            fn : function(elem){
                                if(this.rendered){
                                        this.getEl().parent().parent().addClass('x-item-disabled');
                                }
                            }
                        },
                        "render" :{
                            fn : function(elem){
                                this.enableSuperSpam(Ext.getCmp('spamassassin_smtpAction'));
                            }.createDelegate(this)
                        },
                        "enable" : {
                            fn : function(elem){
                                if(this.rendered){
                                        this.getEl().parent().parent().removeClass('x-item-disabled');
                                }
                            }
                        }
                      }
                    },{
                        xtype : 'checkbox',
                        name : 'Enable SMTP tarpitting',
                        boxLabel : this.i18n._('Enable SMTP tarpitting'),
                        hideLabel : true,
                        checked : this.getBaseSettings().smtpConfig.throttle
                    }/*, {
                        xtype : 'checkbox',
                        name : 'Enable Spam Headers',
                        boxLabel : this.i18n._('Enable Spam Headers'),
                        hideLabel : true,
                        checked : this.getBaseSettings().smtpConfig.addSpamHeaders,
                        listeners : {
                            "check" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().smtpConfig.addSpamHeaders = newValue;
                                }.createDelegate(this)
                            }
                        }
                    }*/]
                }, {
                    xtype : 'fieldset',
                    title : this.i18n._('POP3'),
                    autoHeight : true,
                    labelWidth: 110,
                    items : [{
                        xtype : 'checkbox',
                        name : 'Scan POP3',
                        boxLabel : this.i18n._('Scan POP3'),
                        hideLabel : true,
                        checked : this.getBaseSettings().popConfig.scan,
                        listeners : {
                            "render" : {
                                fn : function(elem) {
                                        if(elem.getValue()){
                                        Ext.getCmp('spamassassin_pop3Strength').enable();
                                        Ext.getCmp('spamassassin_pop3Action').enable();

                                    }else{
                                        Ext.getCmp('spamassassin_pop3Strength').disable();
                                        Ext.getCmp('spamassassin_pop3Action').disable();

                                    }
                                }.createDelegate(this)
                            },
                            "check" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().popConfig.scan = newValue;
                                    if(newValue){
                                        Ext.getCmp('spamassassin_pop3Strength').enable();
                                        Ext.getCmp('spamassassin_pop3Action').enable();

                                    }else{
                                        Ext.getCmp('spamassassin_pop3Strength').disable();
                                        Ext.getCmp('spamassassin_pop3Action').disable();

                                    }
                                }.createDelegate(this)
                            }
                        }
                    }, {
                        border: false,
                        layout:'column',
                        autoWidth : true,
                        items: [{
                            border: false,
                            columnWidth:.6,
                            layout: 'form',
                            labelWidth: 110,
                            items: [{
                                xtype : 'combo',
                                name : 'POP3 Strength',
                                id  : 'spamassassin_pop3Strength',
                                editable : false,
                                store : this.strengthsData,
                                fieldLabel : this.i18n._('Strength'),
                                itemCls : 'left-indent-1',
                                width : 200,
                                mode : 'local',
                                triggerAction : 'all',
                                listClass : 'x-combo-list-small',
                                value : this.getStrengthSelectionValue(this.getBaseSettings().popConfig.strength),
                                listeners : {
                                    "select" : {
                                        fn : function(elem, record) {
                                            var customCmp = Ext.getCmp('spamassassin_pop3StrengthValue');
                                            if (record.data.value == 0) {
                                                customCmp.showContainer();
                                            } else {
                                                customCmp.hideContainer();
                                                this.getBaseSettings().popConfig.strength = record.data.value;
                                            }
                                            customCmp.setValue(this.getBaseSettings().popConfig.strength / 10.0);
                                        }.createDelegate(this)
                                    }
                                }
                            }]
                        },{
                            border: false,
                            columnWidth:.4,
                            layout: 'form',
                            items: [{
                                xtype : 'numberfield',
                                fieldLabel : this.i18n._('Strength Value'),
                                name : 'POP3 Strength Value',
                                id: 'spamassassin_pop3StrengthValue',
                                value : this.getBaseSettings().popConfig.strength / 10.0,
                                width: 100,
                                allowDecimals: true,
                                allowBlank : false,
                                blankText : this.i18n._('Strength Value must be a number. Smaller value is higher strength.'),
                                minValue : -2147483648,
                                maxValue : 2147483647,
                                listeners : {
                                    "change" : {
                                        fn : function(elem, newValue) {
                                          this.getBaseSettings().popConfig.strength = Math.round(newValue * 10);
                                        }.createDelegate(this)
                                    }
                                }
                            }]
                        }]
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
                        id  : 'spamassassin_pop3Action',
                        width : 200,
                        mode : 'local',
                        itemCls : 'left-indent-1',
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
                    labelWidth: 110,
                    items : [{
                        xtype : 'checkbox',
                        name : 'Scan IMAP',
                        boxLabel : this.i18n._('Scan IMAP'),
                        name : 'imapScan',
                        hideLabel : true,
                        checked : this.getBaseSettings().imapConfig.scan,
                        listeners : {
                            "render" : {
                                fn : function(elem) {
                                        if(elem.getValue()){
                                        Ext.getCmp('spamassassin_imapStrength').enable();
                                        Ext.getCmp('spamassassin_imapAction').enable();

                                    }else{
                                        Ext.getCmp('spamassassin_imapStrength').disable();
                                        Ext.getCmp('spamassassin_imapAction').disable();

                                    }
                                }.createDelegate(this)
                            },
                            "check" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().imapConfig.scan = newValue;
                                    if(newValue){
                                        Ext.getCmp('spamassassin_imapStrength').enable();
                                        Ext.getCmp('spamassassin_imapAction').enable();

                                    }else{
                                        Ext.getCmp('spamassassin_imapStrength').disable();
                                        Ext.getCmp('spamassassin_imapAction').disable();

                                    }
                                }.createDelegate(this)
                            }
                        }
                    }, {
                        border: false,
                        layout:'column',
                        autoWidth : true,
                        items: [{
                            border: false,
                            columnWidth:.6,
                            layout: 'form',
                            labelWidth: 110,
                            items: [{
                                xtype : 'combo',
                                name : 'IMAP Strength',
                                id  : 'spamassassin_imapStrength',
                                editable : false,
                                store : this.strengthsData,
                                fieldLabel : this.i18n._('Strength'),
                                itemCls : 'left-indent-1',
                                width : 200,
                                mode : 'local',
                                triggerAction : 'all',
                                listClass : 'x-combo-list-small',
                                value : this.getStrengthSelectionValue(this.getBaseSettings().imapConfig.strength),
                                listeners : {
                                    "select" : {
                                        fn : function(elem, record) {
                                            var customCmp = Ext.getCmp('spamassassin_imapStrengthValue');
                                            if (record.data.value == 0) {
                                                customCmp.showContainer();
                                            } else {
                                                customCmp.hideContainer();
                                                this.getBaseSettings().imapConfig.strength = record.data.value;
                                            }
                                            customCmp.setValue(this.getBaseSettings().imapConfig.strength / 10.0);
                                        }.createDelegate(this)
                                    }
                                }
                            }]
                        },{
                            border: false,
                            columnWidth:.4,
                            layout: 'form',
                            items: [{
                                xtype : 'numberfield',
                                fieldLabel : this.i18n._('Strength Value'),
                                name : 'IMAP Strength Value',
                                id: 'spamassassin_imapStrengthValue',
                                value : this.getBaseSettings().imapConfig.strength / 10.0,
                                width: 100,
                                allowDecimals: true,
                                allowBlank : false,
                                blankText : this.i18n._('Strength Value must be a number. Smaller value is higher strength.'),
                                minValue : -2147483648,
                                maxValue : 2147483647,
                                listeners : {
                                    "change" : {
                                        fn : function(elem, newValue) {
                                          this.getBaseSettings().imapConfig.strength = Math.round(newValue * 10);
                                        }.createDelegate(this)
                                    }
                                }
                            }]
                        }]
                    }, {
                        xtype : 'combo',
                        name : 'IMAP Action',
                        id  : 'spamassassin_imapAction',
                        editable : false,
                        store : new Ext.data.SimpleStore({
                            fields : ['key', 'name'],
                            data : this.spamData
                        }),
                        valueField : 'key',
                        displayField : 'name',
                        fieldLabel : this.i18n._('Action'),
                        itemCls : 'left-indent-1',
                        width : 200,
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
                    }/*, {
                        xtype : 'checkbox',
                        name : 'Enable Spam Headers',
                        boxLabel : this.i18n._('Enable Spam Headers'),
                        hideLabel : true,
                        checked : this.getBaseSettings().imapConfig.addSpamHeaders,
                        listeners : {
                            "check" : {
                                fn : function(elem, newValue) {
                                    this.getBaseSettings().imapConfig.addSpamHeaders = newValue;
                                }.createDelegate(this)
                            }
                        }
                    }*/]
                }, {
                    xtype : 'fieldset',
                    title : this.i18n._('Note'),
                    autoHeight : true,
                    cls: 'description',
                    html : this.i18n._('Spam Blocker was last updated')
                            + ":&nbsp;&nbsp;&nbsp;&nbsp;"
                            + (this.getBaseSettings().lastUpdate != null ? i18n.timestampFormat(this.getBaseSettings().lastUpdate) : i18n
                                    ._("unknown"))
                }]
            });
        },
        // Event Log
        buildEventLog : function() {
            this.gridEventLog = new Ung.GridEventLog({
                helpSource : 'event_log',
                settingsCmp : this,
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
                }, {
                    name : 'score'
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
                    header : this.i18n._("SPAM score"),
                    width : 90,
                    sortable : true,
                    dataIndex : 'score'
                }, {
                    header : this.i18n._("server"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'server'
                }]
            });
        },
        // RBL Event Log
        buildRBLEventLog : function() {
            this.gridRBLEventLog = new Ung.GridEventLog({
                settingsCmp : this,
                name : 'Tarpit Event Log',
                helpSource : 'tarpit_event_log',
                eventManagerFn : this.getRpcNode().getRBLEventManager(),
                title : this.i18n._("Tarpit Event Log"),
                // the list of fields
                fields : [{
                    name : 'timeStamp',
                    sortType : Ung.SortTypes.asTimestamp
                }, {
                    name : 'action',
                    mapping : 'skipped',
                    type : 'string',
                    convert : function(value) {
                        return value ? this.i18n._("skipped") : this.i18n._("blocked");
                    }.createDelegate(this)
                }, {
                    name : 'sender',
                    mapping : 'IPAddr',
                    convert : function(value) {
                        return value == null ? "" : value;
                    }
                }, {
                    name : 'hostname'
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
                    dataIndex : 'action'
                }, {
                    header : this.i18n._("sender"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'sender'
                }, {
                    header : this.i18n._("DNSBL server"),
                    width : 120,
                    sortable : true,
                    dataIndex : 'hostname'
                }]
            });
        },
        validateClient : function() {
            var cmp = null;
            var valid =
                ((cmp = Ext.getCmp('spamassassin_smtpStrengthValue')).isValid() &&
                (cmp = Ext.getCmp('spamassassin_pop3StrengthValue')).isValid() &&
                (cmp = Ext.getCmp('spamassassin_imapStrengthValue')).isValid());
            if (!valid) {
                Ext.MessageBox.alert(i18n._("Failed"), this.i18n._('The value of Strength Value field is invalid.'),
                    function () {
                        this.tabs.activate(this.emailPanel);
                        cmp.focus(true);
                    }.createDelegate(this)
                );
            }
            return valid;
        },
        // save function
        saveAction : function() {
            if (this.validate()) {
            Ext.MessageBox.wait(i18n._("Saving..."), i18n._("Please wait"));
                this.getRpcNode().setBaseSettings(function(result, exception) {
                    Ext.MessageBox.hide();
                    if(Ung.Util.handleException(exception)) return;
                    // exit settings screen
                    this.closeWindow();
                }.createDelegate(this), this.getBaseSettings());
            }
        },

        isDirty : function() {
            return !Ung.Util.equals(this.getBaseSettings(), this.initialBaseSettings);
        }

    });
}