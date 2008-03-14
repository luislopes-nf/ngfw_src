//<script type="text/javascript">
if(!Ung.hasResource["Ung.Spyware"]) {
Ung.hasResource["Ung.Spyware"]=true;
Ung.Settings.registerClassName('untangle-node-spyware',"Ung.Spyware");

Ung.Spyware = Ext.extend(Ung.Settings, {
	gridActiveXList: null,
	gridCookiesList: null,
	gridSubnetList: null,
	panelBlockLists: null,
    gridPassList: null,
    gridEventLog: null,
    onRender: function(container, position) {
    	Ung.Spyware.superclass.onRender.call(this,container, position);
		this.buildBlockLists();
		this.buildPassList();
		this.buildEventLog();
		this.buildTabPanel([this.panelBlockLists,this.gridPassList,this.gridEventLog]);
    },
    
    buildBlockLists: function () {
		this.panelBlockLists=new Ext.Panel({
			winCookiesList: null,
			winActiveXList: null,
			winSubnetList: null,
			subCmps: [],
			title: this.i18n._("Block Lists"),
			parentId: this.getId(),
			initComponent: function() {
				var template=new Ext.Template(
'<div> Web</div><hr/><div><input type="checkbox" id="web_checkbox_{id}" /> Block Spyware & Ad URLs</div>',
'<div> Cookies</div><hr/><div><input type="checkbox" id="cookies_checkbox_{id}" /> Block Tracking & Ad Cookies <span id="cookies_button_{id}"></span></div>',
'<div> ActiveX</div><hr/><div><input type="checkbox" id="activex_checkbox_{id}" /> Block Malware ActiveX Installs <span id="activex_button_{id}"></span></div>',
'<div> Traffic</div><hr/><div><input type="checkbox" id="traffic_checkbox_{id}" /> Monitor Suspicious Traffic <span id="traffic_button_{id}"></span></div>',
'<div> Spyware Blocker signatures were last updated: <span id="last_update_signatures_{id}"></span></div>');
				this.html=template.applyTemplate({id: this.getId()}),
				Ext.Panel.prototype.initComponent.call(this);
			},
			
			afterRender: function() {
				Ext.Panel.prototype.afterRender.call(this);
				
				this.subCmps.push(new Ext.Button({
					'renderTo':'cookies_button_'+this.id,
					'text': i18n._('manage list'),
					'handler': function() {this.onManageCookiesList();}.createDelegate(this)
				}));
				this.subCmps.push(new Ext.Button({
					'renderTo':'activex_button_'+this.id,
					'text': i18n._('manage list'),
					'handler': function() {this.onManageActiveXList();}.createDelegate(this)
				}));
				this.subCmps.push(new Ext.Button({
					'renderTo':'traffic_button_'+this.id,
					'text': i18n._('manage list'),
					'handler': function() {this.onManageTrafficList();}.createDelegate(this)
				}));
			},
		    onManageCookiesList: function () {
		    	var settingsCmp= Ext.getCmp(this.parentId);
		    	if(!this.winCookiesList) {
		    		this.winCookiesList=new Ung.UpdateWindow({
		    			parentId: this.getId(),
		    			listeners: {
		    				'show':{
						        fn: function() {
						        	var panelCmp= Ext.getCmp(this.parentId);
						        	var settingsCmp=Ext.getCmp(panelCmp.parentId);
						        	this.initialChangedData=Ext.encode(settingsCmp.gridCookiesList.changedData);
						        	settingsCmp.gridCookiesList.setHeight(this.getContentHeight());
						        },
						        delay:1
						    }
		    			},
		    			cancelAction: function () {
		    				var panelCmp= Ext.getCmp(this.parentId);
						    var settingsCmp=Ext.getCmp(panelCmp.parentId);
		    				settingsCmp.gridCookiesList.changedData=Ext.decode(this.initialChangedData);
		    				settingsCmp.gridCookiesList.getView().refresh();
		    				this.hide();
		    			},
		    			updateAction: function () {
		    				this.hide();
		    			}
		    		});
			    	if(!settingsCmp.gridCookiesList) {
			    		settingsCmp.buildCookiesList();
			    	}
		    	}
		    	this.winCookiesList.show();
		    	//settingsCmp.gridCookiesList.setSize(300,300);
		    },
		    onManageActiveXList: function () {
		    	alert("TODO");
		    },
		    onManageTrafficList: function () {
		    	alert("TODO");
		    },
			
			beforeDestroy : function(){
		        Ext.destroy(
		            this.winCookiesList,
		            this.winActiveXList,
		            this.winSubnetList
		        );
	        	Ext.each(this.subCmps,Ext.destroy);
		        Ext.Panel.prototype.beforeDestroy.call(this);
		    }
		});
    
    },
    // Cookies List
    buildCookiesList: function() {
	    var logColumn = new Ext.grid.CheckColumn({
	       header: "<b>"+this.i18n._("log")+"</b>", width: 35, dataIndex: 'log', fixed:true
	    });
	    var columns = [
	          {id:'string',header: this.i18n._("string"), width: 140,  dataIndex: 'string',
		          editor: new Ext.form.TextField({allowBlank: false})
	          },
	          {id:'category',header: this.i18n._("category"), width: 140,  dataIndex: 'category',
		          editor: new Ext.form.TextField({allowBlank: false})
	          },
	          logColumn,
	          {id:'description',header: this.i18n._("description"), width: 120, dataIndex: 'description',
		          editor: new Ext.form.TextField({allowBlank: false})
	          }
		];
	    //columnModel.defaultSortable = true;

    	this.gridCookiesList=new Ung.EditorGrid({
    		settingsCmp: this,
    		emptyRow: {"string":"","category":"","log":false,"description":""},
    		title: this.i18n._('Cookies List'),
    		recordJavaClass: "com.untangle.uvm.node.StringRule",
    		proxyRpcFn: this.getRpcNode().getCookieRules,
			fields: [
				{name: 'id'},
				{name: 'string'},
				{name: 'category'},
				{name: 'log'},
				{name: 'description'}
			],
			columns: columns,
			plugins: [logColumn],
			rowEditorInputLines: [
				{name:"string", label: this.i18n._("String"), type:"text", style:"width:200px;"},
				{name:"category", label: this.i18n._("Category"), type:"text", style:"width:200px;"},
				{name:"log", label: this.i18n._("Log"), type:"checkbox"},
				{name:"description", label: this.i18n._("Description"), type:"textarea", style:"width:200px;height:60px;"}
			]
    	});
    	this.gridCookiesList.render(this.panelBlockLists.winCookiesList.getContentEl());
    	this.gridCookiesList.getStore().proxy.setTotalRecords(this.getBaseSettings().cookieRulesLength);
    },
    // Pass List
    buildPassList: function() {
	    var passColumn = new Ext.grid.CheckColumn({
	       header: "<b>"+this.i18n._("pass")+"</b>", width: 35, dataIndex: 'live', fixed:true
	    });
	    var columns = [
	          {id:'site',header: this.i18n._("site"), width: 140,  dataIndex: 'string',
		          editor: new Ext.form.TextField({allowBlank: false})
	          },
	          passColumn,
	          {id:'description',header: this.i18n._("description"), width: 120, dataIndex: 'description',
		          editor: new Ext.form.TextField({allowBlank: false})
	          }
		];
	    //columnModel.defaultSortable = true;

    	this.gridPassList=new Ung.EditorGrid({
    		settingsCmp: this,
    		emptyRow: {"string":"","live":false,"description":""},
    		title: this.i18n._('Pass List'),
    		proxyRpcFn: this.getRpcNode().getDomainWhitelist,
			fields: [
				{name: 'id'},
				{name: 'string'},
				{name: 'live'},
				{name: 'description'}
			],
			columns: columns,
			plugins: [passColumn],
			rowEditorInputLines: [
				{name:"string", label: this.i18n._("Site"), type:"text", style:"width:200px;"},
				{name:"live", label: this.i18n._("Pass"), type:"checkbox"},
				{name:"description", label: this.i18n._("Description"), type:"textarea", style:"width:200px;height:60px;"}
			]
    	});
    	this.gridPassList.getStore().proxy.setTotalRecords(this.getBaseSettings().domainWhitelistLength);
    },
    // Event Log
    buildEventLog: function() {
		// Event Log grid
		this.gridEventLog=new Ung.GridEventLog({
			settingsCmp: this,
			store: new Ext.data.JsonStore({
		        fields: [
		           {name: 'timeStamp'},
		           {name: 'blocked'},
		           {name: 'pipelineEndpoints'},
		           {name: 'protocol'},
		           {name: 'blocked'},
		           {name: 'server'}
		        ]
	    	}),
			columns: [
			    {header: this.i18n._("timestamp"), width: 120, sortable: true, dataIndex: 'timeStamp', renderer: function(value) {
			    	return i18n.timestampFormat(value);
			    }},
			    {header: this.i18n._("action"), width: 70, sortable: true, dataIndex: 'blocked', renderer: function(value) {
			    		return value?this.i18n._("blocked"):this.i18n._("passed");
			    	}.createDelegate(this)
			    },
			    {header: this.i18n._("client"), width: 120, sortable: true, dataIndex: 'pipelineEndpoints', renderer: function(value) {return value===null?"" : value.CClientAddr.hostAddress+":"+value.CClientPort;}},
			    {header: this.i18n._("request"), width: 120, sortable: true, dataIndex: 'protocol'},
			    {header: this.i18n._("reason for action"), width: 120, sortable: true, dataIndex: 'blocked', renderer: function(value) {
			    		return value?this.i18n._("blocked in block list"):this.i18n._("not blocked in block list");
			    	}.createDelegate(this)
			    },
			    {header: this.i18n._("server"), width: 120, sortable: true, dataIndex: 'pipelineEndpoints', renderer: function(value) {return value===null?"" : value.SServerAddr.hostAddress+":"+value.SServerPort;}}
			]
		});
    },
	save: function() {
		this.tabs.disable();
		this.getRpcNode().updateAll(function (result, exception) {
			this.tabs.enable();
			if(exception) {Ext.MessageBox.alert("Failed",exception.message); return;}
			this.node.onCancelClick();
			
		}.createDelegate(this),
			this.getBaseSettings(),
			this.gridActiveXList?this.gridActiveXList.getSaveList():null,
			this.gridCookiesList?this.gridCookiesList.getSaveList():null,
			this.gridSubnetList?this.gridSubnetList.getSaveList():null,
			this.gridPassList.getSaveList() );
	}

});
}
//</script>