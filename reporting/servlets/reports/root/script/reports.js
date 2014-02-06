Ext.namespace('Ung');

var rpc = null;
var reports = null;
var testMode = false;

function getWinHeight(){
    if(!window.innerHeight){
        return window.screen.height - 190;
    }
    return window.innerHeight;
}

function getWinWidth(){
    if(!window.innerWidth){
        return window.screen.width - 190;
    }
    return window.innerWidth;
}

function handleTimeout(ex) {
    if (ex instanceof JSONRpcClient.Exception) {
        if (ex.code == 550) {
            setTimeout(function () { location.reload(true);}, 300);
            return true;
        }
    }
    return false;
}

JSONRpcClient.toplevel_ex_handler = function (ex) {
    handleTimeout(ex);
};
JSONRpcClient.max_req_active = 10;

// Main object class
Ext.define('Ung.Reports', {
    //The selected reports date
    reportsDate:null,
    //The number of days of data in the report
    numDays: null,
    // the table of contents data for the left side
    tableOfContents:null,
    //the selected node from the left side tree
    selectedNode: null,
    //the selected application/system node from the left side tree
    selectedApplication: null,
    //report details object
    reportDetails:null,
    //cuttOffdate 
    cutOffDateInMillisecs: null,    
    // breadcrumbs object for the report details
    breadcrumbs: null,
    //progress bar for various actions
    progressBar: null,
    //print view for printing summary page
    printView: false,
    drillType:null,
    drillValue:null,
    // the Ext.Viewport object for the application
    viewport: null,

    appNames: { },

    constructor: function(config) {
        Ext.apply(this, config);
        this.init();
    },
    init: function() {
        this.initSemaphore = 3;
        this.progressBar = Ext.MessageBox;                
        this.treeNodes =[];
        rpc = {};
        rpc.jsonrpc = new JSONRpcClient("/reports/JSON-RPC");

        rpc.jsonrpc.ReportsContext.languageManager(Ext.bind(this.completeLanguageManager,this));
        rpc.jsonrpc.ReportsContext.skinManager(Ext.bind(this.completeSkinManager,this));
        rpc.jsonrpc.ReportsContext.reportingManager(Ext.bind(this.completeReportingManager,this));
    },

    completeLanguageManager: function( result, exception ) {
        if (exception) {
            if (!handleTimeout(exception)) {
                Ext.MessageBox.alert("Failed", exception.message);
            }
        }
        rpc.languageManager = result;
        // get translations for main module
        rpc.languageManager.getTranslations(Ext.bind(this.completeGetTranslations,this), "untangle-libuvm");
    },

    completeGetTranslations: function( result, exception ) {
        if (exception) {
            if (!handleTimeout(exception)) {
                Ext.MessageBox.alert("Failed", exception.message);
            }
            return;
        }

        i18n = new Ung.I18N({ "map": result.map });
        this.postinit();
    },

    completeSkinManager: function(result,exception) {
        if (exception) {
            if (!handleTimeout(exception)) {
                Ext.MessageBox.alert("Failed", exception.message);
            }
        }
        rpc.skinManager = result;
        rpc.skinManager.getSettings(Ext.bind(this.completeGetSkinSettings,this));
    },

    completeGetSkinSettings: function(result, exception) {
        if (exception) {
            if (!handleTimeout(exception)) {
                Ext.MessageBox.alert("Failed", exception.message);
            }
            return;
        }
        rpc.skinSettings = result;
        var rand = Math.floor(Math.random()*121221121);
        Ung.Util.loadCss("/skins/"+rpc.skinSettings.skinName+"/css/reports.css?r="+rand);
        this.postinit();
    },

    completeReportingManager: function(result, exception) {
        if (exception) {
            if (!handleTimeout(exception)) {
                Ext.MessageBox.alert("Failed", exception.message);
            }
        }
        rpc.reportingManager = result;
        rpc.reportingManager.getDates(Ext.bind(this.completeGetDates,this));
        rpc.reportingManager.getReportsCutoff(Ext.bind(function(result,exception){
            if(exception){
                Ext.MessageBox.alert(i18n._("Failed"), i18n._("Could not retrieve the cutoff date"));
                return;
            }
            this.cutOffDateInMillisecs = result.time;
        },this));         
    },
    

    completeGetDates: function( result, exception ) {
        if (exception) {
            if (!handleTimeout(exception)) {
                Ext.MessageBox.alert("Failed", exception.message);
            }
            return;
        }
        rpc.dates = result;
        this.postinit();
    },

    postinit: function() {
        this.initSemaphore--;
        if (this.initSemaphore != 0) {
            return;
        }
        if(this.printView===true){
            this.startApplicationPrintView();
        }else{
            this.startApplication();
        }
    },
    startApplicationPrintView: function() {
        Ext.get("base").setStyle("width", "740px");
        Ext.get("base").setStyle("overflow", "visible");
        var panel = Ext.create('Ext.panel.Panel',{
            renderTo: 'base',
            cls: "base-container",
            id: 'report-details-container',
            width:740,
            style:{overflow:'visible'},
            bodyStyle:'overflow:visible',
            items: [{
                xtype:'panel',
                style:{overflow:'visible'},
                bodyStyle:'overflow:visible',
                title: 'Report Details&nbsp;<span id="breadcrumbs" class="breadcrumbs"></span>',
                id: 'report-details',
                region:'center',
                collapsible: false,
                split: false,
                margin: '2 2 0 2',
                border: 0,
                items: [{ html:"" }],
                listeners: {
                    'render': function(){
                    }
                }
            }]
        });        
        //reports.changeDate(this.reportsDate.time,this.numDays);
        //reports.selectedApplication = this.app;
        reports.breadcrumbs=[];
        rpc.drilldownType = null;
        rpc.drilldownValue = null;
        
        reports.getApplicationData(reports.selectedApplication, reports.numDays);     
        console.log("Drill Type and value:", this.drillType,",", this.drillValue);
        if ( this.drillType != null && this.drillType.length > 0 && this.drillValue != null && this.drillValue.length > 0) {
            if ( this.drillType=='host') {
                reports.getApplicationDataForHost(reports.selectedApplication,this.drillValue);
            } else if ( this.drillType =='user') {
                reports.getApplicationDataForUser(reports.selectedApplication,this.drillValue);
            } else if ( this.drillType =='email') {
                reports.getApplicationDataForEmail(reports.selectedApplication,this.drillValue);
            }
        }
    },
    startApplication: function() {
        this.reportDatesItems = [];
        for (var i = 0; i < rpc.dates.list.length; i++) {
            this.reportDatesItems.push({
                text: i18n.dateFormat(rpc.dates.list[i].date),
                dt: rpc.dates.list[i].date,
                numDays:rpc.dates.list[i].numDays,
                handler: function()
                {
                    reports.changeDate(this.dt,this.numDays);
                }
            });
        }
        
        var treeStore = Ext.create('Ext.data.TreeStore', {
            root: {
                expanded:true,
                children: []
            }
        });

        this.viewport = Ext.create('Ext.container.Viewport',{
            layout:'border',
            items: [ 
            {
                xtype:'panel',
                region: 'north',
                layout:'border',
                style: 'padding: 7px 5px 7px 7px;background-color:#F0F0F0',
                height: 70,
                border:0,
                defaults: {
                    border: 0,
                    bodyStyle: 'background-color: #F0F0F0;'
                },
                items: [
                {
                    xtype:'panel',
                    html: '<img src="/images/BrandingLogo.png?'+(new Date()).getTime()+'" border="0" height="50"/>',
                    region: 'west',
                    border: 0,
                    width: 100
                }, {
                    xtype: 'label',
                    height:60,
                    style: 'font-family:sans-serif;font-weight:bold;font-size:37px;margin-left:15px;',
                    text: i18n._('Reports'),
                    region: 'center',
                    border: 0
                }, {
                    xtype:'panel',
                    border:0,
                    defaults: {
                        border: 0
                    },
                    region: 'east',
                    height: 60,
                    width: 350,
                    items: [
                    {
                        xtype:"fieldset",
                        layout:'anchor',
                        border: 0,
                        padding: 0,
                        id: 'rangeFieldSet',
                        style:'border: 0',
                        items: [
                        {
                            xtype: 'label',
                            id: 'logout-link',
                            text: i18n._('Logout'),
                            listeners: {
                                "render": {
                                    fn: Ext.bind(function(comp){
                                        comp.getEl().addListener("click",function(){window.top.location = "/auth/logout?url=/reports&realm=Reports";});
                                    },this)
                                }
                            }
                        },
                        {
                            xtype: 'label',
                            id: 'report-date-range',
                            text: reports.getDateRangeText(this.reportDatesItems[0])
                        },
                        {
                            xtype: 'label',
                            id: 'report-day-menu',
                            text: i18n._('View Other Reports'),
                            listeners: {
                                "render": {
                                    fn: Ext.bind(function(comp) {
                                        comp.getEl().on("click",this.showAvailableReports,this);
                                    },this)
                                }
                            }
                        }]
                    }]
                }]
            }, {
                xtype:'panel',
                border:false,
                region:"center",
                layout:"border",
                height: getWinHeight() - 30,
                items: [{
                    xtype:'treepanel',
                    id: 'tree-panel',
                    region: 'west',
                    margin: '1 1 0 1',
                    autoScroll: true,
                    rootVisible: false,
                    title: i18n._('Reports'),
                    enableDD: false,
                    enableDrag: false,
                    width:180,
                    store: treeStore,
                    listeners: {
                        'load': function(node) {
                            if(this.getRootNode().firstChild != null) {
                                this.getSelectionModel().select(this.getRootNode().firstChild);
                            }
                        },
                        'render': function(tp) {
                            tp.getSelectionModel().on('selectionchange', function(tree, node) {
                                if(node!=null && node[0] != null) {
                                    if (node[0].data.id == 'applications') {
                                        return;
                                    }
                                    reports.selectedNode=node[0];
                                    if (node[0].data.id != 'users' && 
                                        node[0].data.id != 'hosts' && 
                                        node[0].data.id != 'emails') {
                                            reports.selectedApplication = node[0].data.id;
                                        }
                                    reports.breadcrumbs=[];
                                    rpc.drilldownType = null;
                                    rpc.drilldownValue = null;
                                    reports.getApplicationData(node[0].data.id, reports.numDays);
                                    }
                                });

                            p = Ext.urlDecode(window.location.search.substring(1));
                            qsDate = p.date;
                            if (qsDate) {
                                dp = qsDate.split('-');
                                d = new Date(parseInt(dp[0]), parseInt(dp[1]) - 1, parseInt(dp[2]));
                                                        
                                reports.changeDate({
                                    javaClass: 'java.util.Date',
                                    ime: d.getTime()
                                },1);
                            } else if (rpc.dates && rpc.dates.list.length > 0) {
                                reports.changeDate(rpc.dates.list[0].date,rpc.dates.list[0].numDays);
                            }
                        }
                    }
                }, {
                    xtype: 'panel',
                    region: 'center',
                    title: 'Report Details&nbsp;<span id="breadcrumbs" class="breadcrumbs"></span>',
                    id: 'report-details',
                    layout:"anchor",
                    height: getWinHeight() - 30,
                    autoScroll: false,
                    collapsible: false,
                    split: true,
                    margin: '1 1 0 3',
                    defaults: {
                        border: false
                    },
                    items: [{ html:"" }]
                }]
            },
            {
                xtype: 'panel',
                border: false,
                region: 'south',
                height: 3
            }]
        });
    },
    getAvailableReportsData: function () {
        return this.reportDatesItems;
    },
    showReportFor: function(value,numDays) {
        var found = -1,i ;
        for(i=0;i<this.reportDatesItems.length;i++){
            if(value==this.reportDatesItems[i].dt.time && numDays == this.reportDatesItems[i].numDays ){
                found = i;
                break;        
            }
        }
        if(found == -1){
            Ext.MessageBox.alert("Unable to load reports","Could not load the selected report");
        }else{
            this.availableReportsWindow.hide();
            if(this.isDynamicDataAvailable(this.reportDatesItems[found])===false){
                alert(i18n._("The data used to calculate the selected report is older than the \"Retention Time\" setting and has been removed from the server. So you may not see any dynamic data for this report.")); //this has to be an alert - inorder to be blocking.
            } 
            this.changeDate(this.reportDatesItems[found].dt, this.reportDatesItems[found].numDays);            
        }
    },
    showAvailableReports: function() {
        if(!this.availableReportsWindow){
            this.datesGrid =Ext.create('Ung.EditorGrid',{
                paginated: false,
                hasReorder: false,
                hasEdit: false,
                hasDelete: false,
                height: getWinHeight()-60,
                hasAdd: false,
                data: this.getAvailableReportsData(),
                title: i18n._( "Report Details" ),
                fields:  [{
                    name: "dt"
                },{
                    name: "numDays"
                },{
                    name: "text"
                }],
                columns: [{
                    header: i18n._( "Generated" ),
                    width: 70,
                    dataIndex: "text",
                    renderer: function (value){
                        return i18n._(value);
                    }
                },{
                    header: i18n._( "Date Range" ),
                    width: 470,
                    flex:1,
                    dataIndex: "dt",
                    renderer: function (value,meta,record){
                        return reports.getDateRangeText(record.data);
                    }
                },{
                    header: i18n._( "View" ),
                    width: 85,
                    dataIndex: "dt",                    
                    renderer: Ext.bind(function(value,meta,record){
                        return '<a href="javascript:reports.showReportFor('+value.time+','+record.data.numDays+')">'+i18n._("View Report")+'</a>';
                    },this)
                    
                },{
                    header: i18n._( "Range Size (days)" ),
                    width: 150,
                    dataIndex: "numDays",
                    renderer: function(value){
                        return value; 
                    }
                },{
                    header: i18n._( "Per Host/User/Email Reports" ),
                    width: 168,
                    dataIndex: "dt",
                    renderer: Ext.bind(function (value,meta,record){
                        return this.isDynamicDataAvailable(record.data) === true ? i18n._("Available"): i18n._("Unavailable");
                    },this)
                }]
            });
            
            this.availableReportsWindow = Ext.create('Ext.Window',{
                applyTo: 'window-container',
                layout: 'fit',
                title: i18n._("Available Reports"),
                width: getWinWidth() - 100,
                resizable: false,
                modal: true,
                draggable: false,
                height: getWinHeight()-30,
                closeAction:'hide',
                plain: true,
                items: Ext.create('Ext.panel.Panel',{
                    border: false,
                    items: this.datesGrid
                }),
                buttons: [{
                    text: i18n._('Close'),
                    handler: Ext.bind(function(){
                        this.availableReportsWindow.hide();
                    },this)
                }]
            });
        }
        
        this.availableReportsWindow.show();
    },
    isDynamicDataAvailable: function(selectedDate) {
         var oneDay = 24*3600*1000,
        toDateInMillisecs =selectedDate.dt.time - oneDay,
        fromDateInMillisecs = new Date(selectedDate.dt.time - ((selectedDate.numDays+1)*oneDay)),
        cutOffDateInMillisecs = this.cutOffDateInMillisecs;

        return fromDateInMillisecs  - cutOffDateInMillisecs < 0  ? false: true;
    },    
    getTreeNodesFromTableOfContent: function(tableOfContents) {
        var treeNodes = [];
        if (tableOfContents.platform != null) {
            treeNodes.push(
                {
                    text: i18n._('Summary'),
                    iconCls:'',
                    cls:'',
                    id: 'untangle-pnode-summary',
                    leaf: true,
                    icon: "node-icons/untangle-vm.png"
                },
                {
                    text: i18n._(tableOfContents.platform.title),
                    id: tableOfContents.platform.name,
                    leaf: true,
                    icon: "./node-icons/untangle-system.png"
                },
                {
                    text: i18n._("Server"),
                    id: "untangle-node-reporting",
                    leaf: true,
                    icon: "./node-icons/server.png"
                },
                {
                    text: i18n._("Shield"),
                    id: "untangle-node-shield",
                    leaf: true,
                    icon: "./node-icons/untangle-node-shield.png"
                }
            );
        }

        if (tableOfContents.applications != null) {
            var tn = {
                text: i18n._("Applications"),
                id: "applications"
            };
            var tc = tableOfContents.applications;
            if (tc.list != null && tc.list.length > 0) {
                tn.leaf = false;
                tn.children = [];
                for (var i = 0; i < tc.list.length; i++) {
                    this.appNames[tc.list[i].name] = tc.list[i].title;
                    tn.children.push({
                        text: i18n._(tc.list[i].title),
                        id: tc.list[i].name,
                        leaf: true,
                        icon: "./node-icons/" + tc.list[i].name + ".png"
                    });
                    tn.expanded = true;
                }
            } else {
                tn.leaf = true;
            }
            treeNodes.push(tn);
        }

        if (tableOfContents.users != null) {
            treeNodes.push({
                text: i18n._("Users"),
                id: "users",
                leaf: true,
                icon: "./node-icons/users.png",
                listeners: {
                    'click': this.refreshContentPane
                }
            });
        }

        if (tableOfContents.hosts != null) {
            treeNodes.push({
                text: i18n._("Hosts"),
                id: "hosts",
                leaf: true,
                icon: "./node-icons/hosts.png",
                listeners: {
                    'click': this.refreshContentPane
                }
            });
        }

        if ( tableOfContents.emails!=null ) {
            treeNodes.push({
                text: i18n._("Emails"),
                id: "emails",
                leaf: true,
                icon: "./node-icons/emails.png",
                listeners: {
                    'click': this.refreshContentPane
                }
            });
        }

        return treeNodes;
    },
    // Refreshes the content pane when a selected node is clicked again
    refreshContentPane: function(node,e) {
        //check if someone's clicking on the selected node
        var selModel = Ext.getCmp('tree-panel').getSelectionModel();
        if(selModel.getSelectedNode().id == node.id){
            //refresh the content pane
            selModel.fireEvent('selectionchange',selModel,node);
        }
    },
    changeDate: function(date,numDays) {
        this.reportsDate=date;
        var item, found = false;
        for (var i = 0; i < this.reportDatesItems.length; i++) {
            item = this.reportDatesItems[i];
            found = false;
            if (item.dt.time == date.time && item.numDays == numDays) {
                //Ext.getCmp('report-day-menu').setText(item.text);
                if(Ext.getCmp('report-date-range')){
                    Ext.getCmp('report-date-range').setText(reports.getDateRangeText(item));
                }
                found = true;
                break;
            }
        }
        if(found){
            this.numDays =  this.reportDatesItems[i].numDays;   
            rpc.reportingManager.getTableOfContents( Ext.bind(function(result, exception) {
                if (exception) {
                    if (!handleTimeout(exception)) {
                        Ext.MessageBox.alert("Failed", exception.message);
                    }
                    return;
                }
                this.tableOfContents = result;
                var treeNodes = this.getTreeNodesFromTableOfContent(this.tableOfContents);
                Ext.getCmp('tree-panel').getSelectionModel().clearSelections();
                Ext.getCmp('tree-panel').setRootNode({
                    expanded: true,
                    children: treeNodes
                });
                Ext.getCmp('tree-panel').getSelectionModel().select(0);
            },this), this.reportsDate, this.numDays);        
        }
    },
    getDateRangeText: function(selectedDate) {
        var oneDay = 24*3600*1000;
        var tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
        
        toDate =new Date( selectedDate.dt.time + tzOffset - oneDay );
        fromDate = new Date( selectedDate.dt.time + tzOffset - ( ( selectedDate.numDays) * oneDay ));
        formatString = 'l, F j Y';
        var startDate = i18n.dateLongFormat(fromDate,formatString);
        var endDate = i18n.dateLongFormat(toDate,formatString);
        if (startDate == endDate) {
            return startDate;
        }
        else {
            return startDate + " - "  + endDate;
        }
    },

    getApplicationData: function(nodeName, numDays) {
        reports.progressBar.wait(i18n._("Please Wait"));        

        if(nodeName == 'untangle-pnode-summary'){
            rpc.reportingManager.getHighlights( Ext.bind(function(result,exception){
                this.processHiglightsData(result,exception,nodeName,numDays);
            },this), reports.reportsDate, numDays);
                    
        }else{
            rpc.reportingManager.getApplicationData(Ext.bind(function(result,exception){
                this.processApplicationData(result,exception,nodeName,numDays);
            },this), reports.reportsDate, numDays, nodeName);
        }
        
    },
    processHiglightsData: function(result,exception,nodeName,numDays) {
        if (exception) {
            if (!handleTimeout(exception)) {
                Ext.MessageBox.alert("Failed",exception.message);
            }
            return;
        }
        rpc.applicationData=result;
        reports.breadcrumbs.push({ text: this.selectedNode.data.text,
                                   handler: Ext.bind(this.getApplicationData,this, [nodeName,numDays])
                                 });
    
        Ung.Util.loadModuleTranslations( nodeName, i18n,
             function(){
                 try{
                     reports.reportDetails = new Ung.ReportDetails({reportType: nodeName});
                     reports.progressBar.hide();
                 }catch(e){
                     alert(e.message);
                 }
             }
        );         
    },
    processApplicationData: function (result,exception,nodeName,numDays) {
        if (exception) {
            if (!handleTimeout(exception)) {
                Ext.MessageBox.alert("Failed",exception.message);
            }
            return;
        }
        rpc.applicationData=result;
        if(this.selectedNode){
            reports.breadcrumbs.push({ text: this.selectedNode.data.text,
                                       handler: Ext.bind(this.getApplicationData,this, [nodeName,numDays]),
                                       drilldownType: rpc.drilldownType,
                                       drilldownValue: rpc.drilldownValue                                   
                                     });
        }                  
        Ung.Util.loadModuleTranslations( nodeName, i18n,
             function(){
                 try{
                     reports.reportDetails = new Ung.ReportDetails({reportType: nodeName});
                     if ( reports.progressBar.rendered) {
                        reports.progressBar.hide();
                     }
                     if(reports.printView){
                         //hack but close enough , could not find a reliable event that would fire after template is displayed.
                         window.setTimeout(function(){window.print();},1000);
                     }
                 }catch(e){
                     alert(e.message);
                 }
             }
        );    
    },
    getDrilldownTableOfContents: function(fnName, type, value) {
        rpc.drilldownType = type;
        rpc.drilldownValue = value;
        reports.progressBar.wait(i18n._("Please Wait"));
        rpc.reportingManager[fnName]( Ext.bind(function (result, exception) {
             if (exception) {
                 var message = i18n._('An error occured on the server and reports could not retrieve the data you requested.');
                 if(exception.message){
                     if (!handleTimeout(exception)) {
                         Ext.MessageBox.alert(this.i18n._("Failed"),exception.message);
                     }
                 }else{
                     Ext.MessageBox.alert(this.i18n._("Failed"),exception.message);
                 }
             }
             rpc.applicationData=result;
             reports.breadcrumbs.push({
                 text: value +" "+i18n._("Reports"),
                handler: Ext.bind(this.getDrilldownTableOfContents,this, [fnName, type, value]),
                drilldownType: rpc.drilldownType,
                drilldownValue: rpc.drilldownValue
             });
             this.reportDetails.buildReportDetails(); // XXX take to correct page
             reports.progressBar.hide();
         },this), reports.reportsDate, reports.numDays, value);
    },

    getTableOfContentsForUser: function(user) {
        return this.getDrilldownTableOfContents('getTableOfContentsForUser', 'user', user);
    },

    getTableOfContentsForHost: function(host) {
        return this.getDrilldownTableOfContents('getTableOfContentsForHost', 'host', host);
    },

    getTableOfContentsForEmail: function(email) {
        return this.getDrilldownTableOfContents('getTableOfContentsForEmail', 'email', email);
    },

    getDrilldownApplicationData: function(fnName, app, type, value) {
        rpc.drilldownType = type;
        rpc.drilldownValue = value;
        this.selectedApplication = app;
        reports.progressBar.wait(i18n._("Please Wait"));
        rpc.reportingManager[fnName]( Ext.bind(function (result, exception) {
            if (exception) {
                if (!handleTimeout(exception)) {
                    Ext.MessageBox.alert(i18n._("Failed"),exception.message);
                }
                return;
            }
            if(result==null){
               Ext.MessageBox.alert(i18n._("No Data Available"),i18n._("The report detail you selected does not contain any data. \n This is most likely because its not possible to drill down any further into some reports."));
               return;
            }      
            rpc.applicationData=result;
            reports.breadcrumbs.push({ text: i18n.sprintf("%s: %s reports ", value, this.appNames[app]),
                                       handler: Ext.bind(this[fnName],this,[app, value]),
                                      drilldownType: rpc.drilldownType,
                                      drilldownValue: rpc.drilldownValue
                                     });
            this.reportDetails.buildReportDetails(); // XXX take to correct page
            reports.progressBar.hide();
        },this), reports.reportsDate, reports.numDays, app, value);
    },

    getApplicationDataForUser: function(app, user) {
        this.getDrilldownApplicationData('getApplicationDataForUser', app, 'user', user);
    },

    getApplicationDataForHost: function(app, host) {
        this.getDrilldownApplicationData('getApplicationDataForHost', app, 'host', host);
    },

    getApplicationDataForEmail: function(app, email) {
        this.getDrilldownApplicationData('getApplicationDataForEmail', app, 'email', email);
    },

    openBreadcrumb: function(breadcrumbIndex) {
        if (this.breadcrumbs.length>breadcrumbIndex) {
            var breadcrumb = this.breadcrumbs[breadcrumbIndex];
            reports.breadcrumbs.splice(breadcrumbIndex, this.breadcrumbs.length-breadcrumbIndex);
            rpc.drilldownType = breadcrumb.drilldownType;
            rpc.drilldownValue = breadcrumb.drilldownValue;
            breadcrumb.handler.call(this);
        }
    }
});

Ext.define("Ung.GridEventLogReports", {
    extend: "Ung.GridEventLogBase",
    // default is getEventQueries() from settingsCmp
//    eventQueriesFn: null,
    // called when the component is initialized
    
    reportsDate: null,
    selectedApplication: null,
    sectionName: null,
    drilldownType: null,
    drilldownValue: null,
    reportingManager: null,
    numDays: null,
    enableColumnHide: true,
    enableColumnMove: true,
    enableColumnMenu: true,
    eventQuery: null,
    constructor: function(config) {         
        this.callParent(arguments);
    },
    initComponent: function() {
        this.callParent(arguments);
    },
    autoRefreshCallback: function(result, exception) {
        if(Ung.Util.handleException(exception)) return;
        var events = result;
        if(testMode) {
            var emptyRec={};
            for(var i=0; i<30; i++) {
                events.list.push(this.getTestRecord(i, this.fields));
            }
        }
    },
    autoRefreshList: function() {
        this.reportingManager.getDetailDataResultSet(Ext.bind(this.refreshCallback, this),this.reportsDate, this.numDays, 
                this.selectedApplication, this.sectionName, this.drilldownType, this.drilldownValue);
    },
    exportHandler: function() {
            
        Ext.MessageBox.wait(i18n._("Exporting Events..."), i18n._("Please wait"));
        var downloadForm = document.getElementById('downloadForm');
        downloadForm["type"].value="reportsEventLogExport";
        
        downloadForm["app"].value=this.selectedApplication;
        downloadForm["section"].value=this.sectionName;
        downloadForm["numDays"].value=this.numDays;
        downloadForm["date"].value=this.reportsDate.time;
        downloadForm["type"].value= this.drilldownType;
        downloadForm["value"].value= this.drilldownValue;
        downloadForm["colList"].value=this.getColumnList();
        
        
        downloadForm.submit();
        Ext.MessageBox.hide();
    },
    getColumnList: function() {
        var columnList = "";
        for (var i=0; i<this.columns.length ; i++) {
            if (!this.columns[i].hidden){
                if (i !== 0)
                    columnList += ",";
                columnList += this.columns[i].dataIndex;
            }
        }
        return columnList;
    },
    refreshHandler: function (forceFlush) {
        this.refreshList();
    },
    flushHandler: function (forceFlush) {
        this.refreshList();
    },
    // called when the component is rendered
    afterRender: function() {
        this.callParent(arguments);
        
    },
    refreshList: function() {
        this.setLoading(i18n._('Querying Database...'));
        this.reportingManager.getDetailDataResultSet(Ext.bind(this.refreshCallback, this),this.reportsDate, this.numDays, 
                this.selectedApplication, this.sectionName, this.drilldownType, this.drilldownValue);
    }
});

// Right section object class
Ext.define('Ung.ReportDetails', {
    reportType: null,
    constructor: function(config) {
        Ext.apply(this, config);
        // this.i18n should be used in ReportDetails to have i18n context based
        this.appName = reports.selectedNode.data.id;
        this.application = reports.selectedApplication;
        this.i18n = Ung.i18nModuleInstances[reports.selectedNode.data.id];
        this.reportType = config.reportType;
        this.buildReportDetails();
    },

    buildDrilldownTableOfContents: function(type) {
        var upperName = type.substring(0,1).toUpperCase() + type.substr(1);

        var data = [];
        var i = 0;
        var list = rpc.applicationData.applications.list;


        for (i=0; i<list.length; i++) {
            data.push([list[i].javaClass,list[i].name,list[i].title]);
        }

        return Ext.create('Ext.grid.Panel',{
            store: Ext.create('Ext.data.ArrayStore', {
                fields: [
                    { name: 'javaClass' },
                    { name: 'name' },
                    { name: 'title' }
                ],
                data: data
            }),
            border:0,
            defaults:{
                border:0
            },
            columns: [{
                header: "Application Name",
                width: 500,
                sortable: false,
                dataIndex: 'title',
                menuDisabled: true,
                renderer: Ext.bind(function(value, medata, record) {
                    return '<a href="javascript:reports.getApplicationDataFor' + upperName + '(\'' + record.data.name + '\', \'' + rpc.drilldownValue + '\')">' + value + '</a>';
                },this)
            }],
            title:this.i18n._('Application List'),
            height: 500,
            stripeRows: true,
            hideHeaders: true,
            enableColumnHide: false,
            enableColumnMove: false
        });
    },

    buildUserTableOfContents: function() {
        return this.buildDrilldownTableOfContents('user');
    },

    buildHostTableOfContents: function() {
        return this.buildDrilldownTableOfContents('host');
    },

    buildEmailTableOfContents: function() {
        return this.buildDrilldownTableOfContents('email');
    },

    buildDrilldownList: function(type, title, listTitle) {
        var pluralName = type + 's';
        var upperName = type.substring(0,1).toUpperCase() + type.substr(1);

        var data = [];
        var i = 0;

        for(i=0;i<reports.tableOfContents[pluralName].list.length;i++){
            data.push([reports.tableOfContents[pluralName].list[i].javaClass,
                       reports.tableOfContents[pluralName].list[i].name,null]);
        }

        return Ext.create('Ext.grid.Panel',{
            border:0,
            defaults: {
                border:0
            },
            store: Ext.create('Ext.data.ArrayStore',{
                fields: [
                    {name: 'javaClass'},
                    {name: 'name'},
                    {name: 'linkType'} //this is not used currently
                ],
                sorters: {
                    property: "name",
                    direction: "ASC"
                },
                data: data }),
            columns: [{
                header: title,
                width: 500,
                sortable: false,
                dataIndex: 'name',
                menuDisabled: true,
                renderer: Ext.bind(function(value, medata, record) {
                    return '<a href="javascript:reports.getTableOfContentsFor' + upperName + '(\''+ value + '\')">' + value + '</a>';
                },this)
            }],
            title:listTitle,
            height: 500,
            stripeRows: true,
            hideHeaders: true,
            enableColumnMove: false
        });
    },

    buildUserList: function() {
        return this.buildDrilldownList('user', this.i18n._('User'), this.i18n._('User List'));
    },

    buildHostList: function() {
        return this.buildDrilldownList('host', this.i18n._('Host'), this.i18n._('Host List'));
    },

    buildEmailList: function() {
        return this.buildDrilldownList('email', this.i18n._('Email'), this.i18n._('Email List'));
    },

    buildReportDetails: function() {
        var reportDetails = Ext.getCmp("report-details");
        while (reportDetails.items.length!=0) {
            reportDetails.remove(reportDetails.items.get(0));
        }

        var itemsArray=[],i;
        //TODO rpc.applicationData should never be null
        if (rpc.applicationData != null) {
            if(reports.selectedApplication =='untangle-pnode-summary'){
                if(typeof(rpc.applicationData.list)=='object'){
                    //add highlights only if there is a highlights section
                    itemsArray.push(this.buildHighlightSection(rpc.applicationData, 'Summary'));
                }               
            }else{
                if(rpc.applicationData.sections != null){
                    for(i=0;i<rpc.applicationData.sections.list.length ;i++) {
                        var section=rpc.applicationData.sections.list[i];
                        var sectionPanel=this.buildSection(rpc.applicationData.name, section);
                        itemsArray.push(sectionPanel);
                    }
                }
            }
        }
    

        //create breadcrums item
        var breadcrumbArr=[];
        for(i=0;i<reports.breadcrumbs.length;i++) {
            if(i+1==reports.breadcrumbs.length) {
                breadcrumbArr.push(reports.breadcrumbs[i].text);
            } else {
                breadcrumbArr.push('<a href="javascript:reports.openBreadcrumb('+i+')">'+reports.breadcrumbs[i].text+'</a>');
            }
        }
        document.getElementById("breadcrumbs").innerHTML='<span class="icon-breadcrumbs-separator">&nbsp;&nbsp;&nbsp;&nbsp;</span>'+breadcrumbArr.join('<span class="icon-breadcrumbs-separator">&nbsp;&nbsp;&nbsp;&nbsp;</span>');
        if (itemsArray && itemsArray.length > 0) {
            var cfg={anchor: '100% 100%',
                    autoWidth: true,
                    border: false,
                    defaults:{anchor: '100% 100%',
                        border:false,
                        autoWidth: true},
                    activeTab: 0,
                    items: itemsArray};
            if (reports.printView == false) {
                cfg.defaults.autoScroll = true;
            } else {
                cfg.style={};
                cfg.style.overflow='visible';
                cfg.bodyStyle='overflow:visible';
            }
            this.tabPanel= Ext.create('Ext.tab.Panel',cfg);
            reportDetails.add(this.tabPanel);
        } else if(this.reportType != null) {
            var selectedType = 'toc';
            var reportTypeMap = {
                'users': {
                    'toc': Ext.bind(this.buildUserList,this),
                    'com.untangle.node.reporting.items.TableOfContents': Ext.bind(this.buildUserTableOfContents,this)
                },
                'hosts': {
                    'toc': Ext.bind(this.buildHostList,this),
                    'com.untangle.node.reporting.items.TableOfContents': Ext.bind(this.buildHostTableOfContents,this)
                },
                'emails': {
                    'toc': Ext.bind(this.buildEmailList,this),
                    'com.untangle.node.reporting.items.TableOfContents': Ext.bind(this.buildEmailTableOfContents,this)
                }
            };
            if (reportTypeMap[this.reportType] != null) {
                if (rpc.applicationData != null && reportTypeMap[this.reportType][rpc.applicationData.javaClass] != null) {
                    selectedType = rpc.applicationData.javaClass;
                }
            }
            if(reportTypeMap[this.reportType] != null){
                reportDetails.add(reportTypeMap[this.reportType][selectedType]());
            }
        }
        reportDetails.doLayout();
    },

    buildSection: function(appName, section) {
        var sectionPanel=null;
        if (section.javaClass=="com.untangle.node.reporting.items.SummarySection") {
            sectionPanel=this.buildSummarySection(appName, section);
        } else if (section.javaClass=="com.untangle.node.reporting.items.DetailSection") {
            sectionPanel=this.buildDetailSection(appName, section);
        }
        return sectionPanel;
    },
    buildHighlightSection: function (highlights,tabName) {
        var items = [],i,str;
        items.push({
            html: '<div class="summary-header"><img height="50" border="0" src="/images/BrandingLogo.png"/><strong>'+i18n._('Reports Summary')+'</strong></div>',
            colspan: 2
            
        });
        for(i=0;i<highlights.list.length;i++){
            str = this.getHighlightHTML(highlights.list[i],true);
            if( i != 0 ){
                str = str.replace('first','');
            }
            if(i % 2){
                str = str.replace('highlight-2', 'highlight-2 odd');
            }
            items.push({html:str,colspan:2});
        }
        return Ext.create('Ext.panel.Panel',{
            title: i18n._('Summary'),
            layout:{ 
                type:'table',
                columns:2,
                tableAttrs: {
                    style: {
                        width: '100%'
                    }
                }
            },
            border:false,
            defaults: {
                border:false
            },
            columnWidth: 0.5,
            items:items
        });
        
    },
    getHighlightHTML: function(summaryItem,smallIcons) {
        var stringTemplate = summaryItem.stringTemplate,
            key,hvm,
            imagePath = smallIcons === true ?  '/reports/node-icons/': '/reports/chiclet?name=' ,
            imageSuffix = smallIcons === true ? '.png': '',
            highlightClass = smallIcons === true  ? 'highlight-2': 'highlight',
            url;
        stringTemplate = stringTemplate.replace(summaryItem.name,'<strong>'+summaryItem.title+'</strong>');
        hvm = summaryItem.highlightValues.map;
        for (key in hvm) {
        stringTemplate = stringTemplate.replace('%(' + key + ')s',
                            '<strong>' + hvm[key] + '</strong>');
        }
        url = imagePath + summaryItem.name + imageSuffix;
        return '<div class="'+highlightClass+' first"><p style="background-image:url('+url+');margin-top:0px;margin-bottom:0px;">'+stringTemplate+'</p></div>';        
    },

    buildSummarySection: function (appName, section) {
        var drillDownType='', drillDownValue='';
        if ( reports.breadcrumbs.length > 1) {
            drillDownType = reports.breadcrumbs[reports.breadcrumbs.length-1].drilldownType;
            drillDownValue = reports.breadcrumbs[reports.breadcrumbs.length-1].drilldownValue;
        }
        var items = [];
        //add the print button
        if(reports.printView===false){
            var printargs = [
                                ['rdate',reports.reportsDate.time].join('='),
                                ['duration',reports.numDays].join('='),
                                ['aname',appName].join('='),
                                ['drillType',drillDownType].join('='),
                                ['drillValue',drillDownValue].join('='),
                                ['r',Math.floor(Math.random()*121221121)].join('=')
                            ].join('&');
            items.push({
                html:'<a target="_print" href="?'+printargs+'" class="print small-right-margin">'+i18n._('Print')+'</a>',
                colspan: 2        
            });
        }
        
        
        for (var i = 0; i < section.summaryItems.list.length; i++) {
            var summaryItem = section.summaryItems.list[i];       

        if (summaryItem.stringTemplate) {
            str = this.getHighlightHTML(summaryItem,false);
            columns = [];
            items.push({html:str,colspan:2,bodyStyle:'padding:10px'});
        } else {

            // graph
            
            items.push({html:'<img src="'+summaryItem.imageUrl+'" width="338" height="230"/>', bodyStyle:'padding:20px'});
            // key statistics

            colors = summaryItem.colors.map;

            columns = [];
            var data = [],columnTwoWidth=175;
            for (var j=0; j<summaryItem.keyStatistics.list.length; j++) {
                var keyStatistic = summaryItem.keyStatistics.list[j];
                data.push([keyStatistic.label, keyStatistic.value, keyStatistic.unit, keyStatistic.linkType, colors[keyStatistic.label]]);
            }

            columns = [];

            if (summaryItem.plotType == 'pie-chart') {
                columnTwoWidth = 135;
                columns.push({
                    header: "Color",
                    width: 25,
                    sortable: false,
                    menuDisabled: true,
                    dataIndex: 'color',
                    renderer: Ext.bind(function(value, medata, record) {
                        return '<div style="position:absolute;height:8px;width:8px;margin-top:2px;background-color:#'+value+'">&nbsp;</div>';
                        //return value;
                    },this)
                });
            }

            columns.push({
                header: "Label",
                width: columnTwoWidth,
                sortable: false,
                menuDisabled: true,
                dataIndex: 'label',
                renderer: Ext.bind(function(value, medata, record) {
                    var linkType = record.data.linkType;
                    if (linkType == "UserLink") {
                        return '<a href="javascript:reports.getApplicationDataForUser(\'' + appName + '\', \'' + value + '\')">' + value + '</a>';
                    } else if (linkType == "HostLink") {
                        return '<a href="javascript:reports.getApplicationDataForHost(\'' + appName + '\', \'' + value + '\')">' + value + '</a>';
                    } else if (linkType == "EmailLink") {
                        return '<a href="javascript:reports.getApplicationDataForEmail(\'' + appName + '\', \'' + value + '\')">' + value + '</a>';
                    } else if (linkType == "URLLink") {
                        return '<a href="http://' + value + '" target="_new">' + value + '</a>';
                    } else {
                        return this.i18n._(value);
                    }
                },this)
            });

            columns.push({
                header: "Value",
                width: 150,
                sortable: false,
                menuDisabled: true,
                dataIndex: 'value',
                renderer: Ext.bind(function (value, medata, record) {
                    var unit = record.data.unit;
                    var s;
                    if (unit && unit.indexOf('bytes') == 0) {
                        if (value < 1000000) {
                            value = Math.round(value/1000);
                            s = unit.split("/");
                            s[0] = "KB";
                            unit = s.join("/");
                        } else if (value < 1000000000) {
                            value = Math.round(value/1000000);
                            s = unit.split("/");
                            s[0] = "MB";
                            unit = s.join("/");
                        } else {
                            value = Math.round(value/1000000000);
                            s = unit.split("/");
                            s[0] = "GB";
                            unit = s.join("/");
                        }
                    }

                    var v = this.i18n.numberFormat(value);

                    return unit == null ? v: (v + " " + this.i18n._(unit));
                }, this)
            });
            items.push(Ext.create('Ext.grid.Panel',{
                style: 'margin-top:10px;',
                autoScroll: true,
                height: 243,
                border:0,
                store: Ext.create('Ext.data.ArrayStore',{
                    fields: [
                        {name: 'label'},
                        {name: 'value'},
                        {name: 'unit'},
                        {name: 'linkType'},
                        {name: 'color'}
                    ],
                    data: data
                }),
                columns: columns,
                // inline toolbars
                tbar:[
                {
                    xtype: 'label',
                    text: this.i18n._('Key Statistics'),
                    style: 'font-weight: bold;padding-left:3px;',
                    width: 150
                },
                {
                    xtype:'button',
                    width:100,
                    tooltip:this.i18n._('Export Excel'),
                    style: 'padding: 0px 0px 0px 0px;',
                    iconCls:'export-excel',
                    text: i18n._('Export Data'),
                    handler: new Function("window.open('" + summaryItem.csvUrl + "');")
                }],
                header: false,
                stripeRows: true,
                hideHeaders: true,
                enableColumnMove: false
                }));
            }
        }
        var cfg={title: section.title,
                layout:{ 
            	    type:'table',
            	    columns: 2,
                    tableAttrs: {
                        style: {
                            width: '100%'
                        }
                    },
                    tdAttrs: {
                        width: '50%'
                    }
                },
                border: 0,
                defaults: {
                    border: 0,
                    cls: 'top-align'
                },
                items:items
        };
        if (reports.printView == true) {
            cfg.style={};
            cfg.style.overflow='visible';
            cfg.bodyStyle='overflow:visible';
        } else {
            cfg.autoScroll = true;
        }
        return Ext.create('Ext.panel.Panel',cfg);
    },

    buildDetailSection: function (appName, section) {
        var columns = [];
        var c = null;
        var fields = [];
        
        for (var i = 0; i < section.columns.list.length; i++) {
            c = section.columns.list[i];
            if (c === null || c === undefined) { break; }
            var col = {
                header:this.i18n._(c.title), 
                dataIndex:c.name
            };

            if (c.type == "Date") {
                col.renderer = function(value) {
                    if (!value) {
                        return i18n._('None');
                    } else {
                        return i18n.timestampFormat(value);
                    }
                };
                col.width = 140;
            } else if (c.type == "URL") {
                col.renderer = function(value) {
                    if (!value) {
                        return i18n._('None');
                    } else {
                        return '<a href="' + value + '" target="_new">' + value + '</a>';
                    }
                };
                col.width = 160;
            } else if (c.type == "UserLink") {
                col.renderer = function(value) {
                    if (!value) {
                        return i18n._('None');
                    } else {
                        return '<a href="javascript:reports.getApplicationDataForUser(\'' + appName + '\', \'' + value + '\')">' + value + '</a>';
                    }
                };
                col.width = 100;
            } else if (c.type == "HostLink") {
                col.renderer = function(value) {
                    if (!value) {
                        return i18n._('None');
                    } else {
                        return '<a href="javascript:reports.getApplicationDataForHost(\'' + appName + '\', \'' + value + '\')">' + value + '</a>';
                    }
                };
                col.width = 100;
            } else if (c.type == "EmailLink") {
                col.renderer = function(value) {
                    if (!value) {
                        return i18n._('None');
                    } else {
                        return '<a href="javascript:reports.getApplicationDataForEmail(\'' + appName + '\', \'' + value + '\')">' + value + '</a>';
                    }
                };
                col.width = 180;
            } else if (c.type == "URLLink") {
                col.renderer = function(value) {
                    if (!value) {
                        return i18n._('None');
                    } else {
                        return '<a href="http://' + value + '" target="_new">' + value + '</a>';
                    }
                };
            } else {
                col.renderer = function(value) {
                    if (!value) {
                        return i18n._('None');
                    } else {
                        return value;
                    }
                };
            }
            if (c.type == "Boolean"){
                col.filter = {
                    type: 'boolean'
                };
            } else if (c.type == "Numeric") {
                col.filter = {
                    type: 'numeric'
                };
            }
            col.hidden = c.hidden;
            columns.push(col);
            fields.push({ name: c.name });
        }
        
        
        var detailSection = null;
            detailSection = Ext.create('Ung.GridEventLogReports',{
                name: section.title,
                settingsCmp: this,
                title: section.title,
                reportsDate: reports.reportsDate,
                selectedApplication: reports.selectedApplication,
                sectionName: section.name,
                drilldownType: rpc.drilldownType,
                drilldownValue: rpc.drilldownValue,
                reportingManager: rpc.reportingManager,
                eventQuery: section.sql,
                numDays: reports.numDays,
                columns: columns,
                hasTimestampFilter: false,
                hasAutoRefresh: false,
                fields: fields
            });
                
//                Ung.CustomEventLog.buildHttpEventLogImpl (this, 'EventLog', section.title, 
//                this.helpSourceName + '_event_log', columns, null, 'Ung.GridEventLogReports', false, false);
 
        return detailSection;
    }
});
