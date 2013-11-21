Ext.namespace('Ung');
Ext.namespace('Ung.form');
Ext.namespace('Ung.grid');
Ext.BLANK_IMAGE_URL = '/ext4/resources/themes/images/gray/tree/s.gif'; // The location of the blank pixel image
Ext.Loader.setConfig({enabled: true});
Ext.Loader.setPath('Ext.ux', '/ext4/examples/ux');
Ext.require([
    'Ext.ux.data.PagingMemoryProxy',
    'Ext.ux.grid.FiltersFeature'
]);

if(typeof console === "undefined") {
    //Prevent console.log triggering errors on browsers without console support
    var console = {
        log: function() {},
        error: function() {},
        debug: function() {}
    };
}

if (typeof String.prototype.trim !== "function") {
    // implement trim for browsers like IceWeasel 3.0.6
    String.prototype.trim = function () {
        return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };
}

var i18n=Ext.create('Ung.I18N',{"map":null}); // the main internationalization object
var rpc=null; // the main json rpc object
var testMode = false;

Ext.override(Ext.MessageBox, {
    alert: function() {
        this.callParent(arguments);
        //Hack to solve the issue with alert being displayed behind the current settings window after a jabsorb call.
        Ext.defer(this.toFront, 10, this);
    }
});

Ext.override(Ext.Button, {
    listeners: {
        "afterrender": {
            fn: function() {
                if (this.name && this.getEl()) {
                    this.getEl().set({
                        'name': this.name
                    });
                }
            }
        }
    }
});

Ext.override(Ext.form.field.Base, {
    msgTarget: 'side',
    clearDirty: function() {
        if(this.xtype=='radiogroup') {
            this.items.each(function(item) {
                item.clearDirty();
            }); 
        } else {
            this.originalValue=this.getValue();
        }
    },
    afterRender: Ext.Function.createSequence(Ext.form.Field.prototype.afterRender,function() {
        Ext.QuickTips.init();    
        var qt = this.tooltip;
        var target = null;
        
        try {
            if(this.xtype=='checkbox') {
                target = this.labelEl;
            } else {        
                target = this.container.dom.parentNode.childNodes[0];        
            }
        } catch(exn) {
            //don't bother if there's nothing to target
        }

        if (qt && target) { 
            Ext.QuickTips.register({
                target: target,
                title: '',
                text: qt,
                enabled: true,
                showDelay: 20
            });
        }
    })
});

Ext.override(Ext.panel.Panel, {
    listeners: {
        "afterrender": {
            fn: function() {
                if (this.name && this.getEl()) {
                    this.getEl().set({
                        'name': this.name + " Content"
                    });
                }
            }
        }
    }
});

Ext.override(Ext.Toolbar, {
    nextBlock: function() {
        var td = document.createElement("td");
        if (this.columns && (this.tr.cells.length == this.columns)) {
            this.tr = document.createElement("tr");
            var tbody = this.el.down("tbody", true);
            tbody.appendChild(this.tr);
        }
        this.tr.appendChild(td);
        return td;
    },
    insertButton: Ext.Function.createSequence(function() {
        if (this.columns) {
            throw "This method won't work with multiple rows";
        }
    }, Ext.Toolbar.prototype.insertButton)
});

Ext.override(Ext.PagingToolbar, {
    listeners: {
        "afterrender": {
            fn: function() {
                if (this.getEl()) {
                    this.getEl().set({
                        'name': "Paging Toolbar"
                    });
                }
            }
        }
    }
});

Ext.override( Ext.form.FieldSet, {
   border: 0 
});

Ext.define("Ung.form.DayOfWeekMatcherField", {
    extend: "Ext.form.CheckboxGroup",
    alias: "widget.udayfield",
    columns: 7,
    width: 700,
    isDayEnabled: function (dayOfWeekMatcher, dayInt) {
        if (dayOfWeekMatcher.indexOf("any") != -1)
            return true;
        if (dayOfWeekMatcher.indexOf(dayInt.toString()) != -1)
            return true;
        switch (dayInt) {
          case 1:
            if (dayOfWeekMatcher.indexOf("sunday") != -1)
                return true;
            break;
          case 2:
            if (dayOfWeekMatcher.indexOf("monday") != -1)
                return true;
            break;
          case 3:
            if (dayOfWeekMatcher.indexOf("tuesday") != -1)
                return true;
            break;
          case 4:
            if (dayOfWeekMatcher.indexOf("wednesday") != -1)
                return true;
            break;
          case 5:
            if (dayOfWeekMatcher.indexOf("thursday") != -1)
                return true;
            break;
          case 6:
            if (dayOfWeekMatcher.indexOf("friday") != -1)
                return true;
            break;
          case 7:
            if (dayOfWeekMatcher.indexOf("saturday") != -1)
                return true;
            break;
        }
        return false;
    },
    items: [{
        xtype: 'checkbox',
        name: 'sunday',
        dayId: '1',
        boxLabel: this.i18n._('Sunday'),
        hideLabel: true
    },{
        xtype: 'checkbox',
        name: 'monday',
        dayId: '2',
        boxLabel: this.i18n._('Monday'),
        hideLabel: true
    },{
        xtype: 'checkbox',
        name: 'tuesday',
        dayId: '3',
        boxLabel: this.i18n._('Tuesday'),
        hideLabel: true
    },{
        xtype: 'checkbox',
        name: 'wednesday',
        dayId: '4',
        boxLabel: this.i18n._('Wednesday'),
        hideLabel: true
    },{
        xtype: 'checkbox',
        name: 'thursday',
        dayId: '5',
        boxLabel: this.i18n._('Thursday'),
        hideLabel: true
    },{
        xtype: 'checkbox',
        name: 'friday',
        dayId: '6',
        checked: true,
        boxLabel: this.i18n._('Friday'),
        hideLabel: true
    },{
        xtype: 'checkbox',
        name: 'saturday',
        dayId: '7',
        boxLabel: this.i18n._('Saturday'),
        hideLabel: true
    }],
    arrayContains: function(array, value) {
        for (var i = 0 ; i < array.length ; i++) {
            if (array[i] === value) 
                return true;
        }
        return false;
    },
    initComponent: function() {
        var i;
        var initValue = "none";
        if ((typeof this.value) == "string") {
             initValue = this.value.split(",");
        }
        this.value = null;
        for (i = 0 ; i < this.items.length ; i++)
            this.items[i].checked = false;
        for (i = 0 ; i < this.items.length ; i++) {
            var item = this.items[i];
            if ( this.arrayContains(initValue, item.dayId) || this.arrayContains(initValue, item.name) || this.arrayContains(initValue, "any")) {
                item.checked = true;
            }
        }
        this.callParent(arguments);
    },
    getValue: function() {
        var checkCount = 0;
        var i;
        for (i = 0 ; i < this.items.length ; i++) 
            if (this.items.items[i].checked)
                checkCount++;
        if (checkCount == 7)
            return "any";
        var arr = [];
        for (i = 0 ; i < this.items.length ; i++) 
            if (this.items.items[i].checked)
                arr.push(this.items.items[i].dayId);
        if (arr.length === 0){
            return "none";
        } else {
            return arr.join();
        }
            
    }
});

Ung.Util = {
    isDirty: function (item, depth) {
        if(depth==null) {
            depth=0;
        } else if(depth>30) {
            console.log("Ung.Util.isDirty depth>30");
            return false;
        }
        if(item==null) {
            return false;
        }
        if(Ext.isFunction(item.isDirty)) {
            return item.isDirty();
        }
        if(item.items!=null && item.items.length>0) {
            var hasGet=Ext.isFunction(item.items.get);
            for (var i = 0; i < item.items.length; i++) {
                var subItem = hasGet?item.items.get(i):item.items[i];
                if(Ung.Util.isDirty(subItem, depth+1)) {
                    return true;   
                }
            }
        }
        return false;
    },
    clearDirty: function(item, depth) {
        if(depth==null) {
            depth=0;
        } else if(depth>30) {
            console.log("Ung.Util.clearDirty depth>30");
            return;
        }
        if(item==null) {
            return;
        }
        if(Ext.isFunction(item.isDirty)) {
            if(!item.isDirty()) {
                return;
            }
        }
        if(Ext.isFunction(item.clearDirty)) {
            item.clearDirty();
            return;
        }
        if(item.items!=null && item.items.length>0) {
            var hasGet=Ext.isFunction(item.items.get);
            for (var i = 0; i < item.items.length; i++) {
                var subItem = hasGet?item.items.get(i):item.items[i];
                Ung.Util.clearDirty(subItem, depth+1);
            }
        }
    },
    isValid: function (item, depth) {
        if(depth==null) {
            depth=0;
        } else if(depth>30) {
            console.log("Ung.Util.isValid depth>30");
            return true;
        }
        if(item==null) {
            return true;
        }
        if(Ext.isFunction(item.isValid)) {
            return item.isValid();
        }
        if(item.items!=null && item.items.length>0) {
            var hasGet=Ext.isFunction(item.items.get);
            for (var i = 0; i < item.items.length; i++) {
                var subItem = hasGet?item.items.get(i):item.items[i];
                if(!Ung.Util.isValid(subItem, depth+1)) {
                    return false;   
                }
            }
        }
        return true;
    },
    goToStartPage: function () {
        Ext.MessageBox.wait(i18n._("Redirecting to the start page..."), i18n._("Please wait"));
        window.location.href="/webui";
    },
    showWarningMessage:function(message, details, errorHandler) {
        var wnd = Ext.create('Ext.window.Window', {
            title: i18n._('Warning'),
            modal:true,
            closable:false,
            layout: "fit",
            setSizeToRack: function () {
                var objSize = main.viewport.getSize();
                objSize.width = objSize.width - main.contentLeftWidth;
                this.setPosition(main.contentLeftWidth, 0);
                this.setSize(objSize);
            },
            items: {
                xtype: "panel",
                minWidth: 350,
                autoScroll: true,
                items: [{
                    xtype: "fieldset",
                    items: [{
                        xtype: "label",
                        html: message
                    }]
                }, {
                    xtype: "fieldset",
                    items: [{
                        xtype: "button",
                        name: "details_button",
                        text: i18n._("Show details"),
                        hidden: details==null,
                        handler: function() {
                            var detailsComp = wnd.query('fieldset[name="details"]')[0];
                            var detailsButton = wnd.query('button[name="details_button"]')[0];
                            if(detailsComp.isHidden()) {
                                wnd.initialHeight = wnd.getHeight();
                                wnd.initialWidth = wnd.getWidth();
                                detailsComp.show();
                                detailsButton.setText(i18n._('Hide details'));
                                wnd.setSizeToRack();
                            } else {
                                detailsComp.hide();
                                detailsButton.setText(i18n._('Show details'));
                                wnd.restore();
                                wnd.setHeight(wnd.initialHeight);
                                wnd.setWidth(wnd.initialWidth);
                                wnd.center();
                            }
                        },
                        scope : this
                    }]
                }, {
                    xtype: "fieldset",
                    name: "details",
                    hidden: true,
                    html: details!=null ? details : ''
                }]
            },
            buttons: [{
                text: i18n._('OK'), 
                handler: function() { 
                    if ( errorHandler) {
                        errorHandler();
                    } else {
                        wnd.close();
                    }
                }
            }]
        });
        wnd.show();
        if(Ext.MessageBox.rendered) {
            Ext.MessageBox.hide();    
        }
    },
    rpcExHandler: function(exception, continueExecution) {
        Ung.Util.handleException(exception);
        if(!continueExecution) {
            if(exception) {
                throw exception;
            }
            else {
                throw i18n._("Error making rpc request to server");
            }
        }
    },
    handleException: function(exception, handler, type, continueExecution) { //type: alertCallback, alert, noAlert
        if(exception) {
            console.error("handleException:", exception);
            if(exception.message == null) {
                exception.message = "";
            }
            var message = null;
            var gotoStartPage=false;
            /* special text for rack error */
            if (exception.name == "java.lang.Exception" && (exception.message.indexOf("already exists in Policy") != -1)) {
                message  = i18n._("This application already exists in this policy/rack.") + ":<br/>";
                message += i18n._("Each application can only be installed once in each policy/rack.") + "<br/>";
            }
            /* handle connection lost */
            if( exception.code==550 || exception.code == 12029 || exception.code == 12019 || exception.code == 0 ||
                /* handle connection lost (this happens on windows only for some reason) */
                (exception.name == "JSONRpcClientException" && exception.fileName != null && exception.fileName.indexOf("jsonrpc") != -1) ||
                /* special text for "method not found" and "Service Temporarily Unavailable" */
                exception.message.indexOf("method not found") != -1 ||
                exception.message.indexOf("Service Unavailable") != -1 ||
                exception.message.indexOf("Service Temporarily Unavailable") != -1 ||
                exception.message.indexOf("This application is not currently available") != -1) {
                message  = i18n._("The connection to the server has been lost.") + "<br/>";
                message += i18n._("Press OK to return to the login page.") + "<br/>";
                if (type !== "noAlert") {
                    handler = Ung.Util.goToStartPage; //override handler
                }
            }
            /* worst case - just say something */
            if (message == null) {
                message = i18n._("An error has occurred.");
            }
            
            var details = "";
            if ( exception ) {
                if ( exception.javaStack )
                    exception.name = exception.javaStack.split('\n')[0]; //override poor jsonrpc.js naming
                if ( exception.name )
                    details += "<b>" + i18n._("Exception name") +":</b> " + exception.name + "<br/><br/>";
                if ( exception.code )
                    details += "<b>" + i18n._("Exception code") +":</b> " + exception.code + "<br/><br/>";
                if ( exception.message )
                    details += "<b>" + i18n._("Exception message") + ":</b> " + exception.message.replace(/\n/g, '<br/>') + "<br/><br/>";
                if ( exception.javaStack )
                    details += "<b>" + i18n._("Exception java stack") +":</b> " + exception.javaStack.replace(/\n/g, '<br/>') + "<br/><br/>";
                if ( exception.stack ) 
                    details += "<b>" + i18n._("Exception js stack") +":</b> " + exception.stack.replace(/\n/g, '<br/>') + "<br/><br/>";
                if ( rpc.fullVersionAndRevision != null ) 
                    details += "<b>" + i18n._("Build") +":&nbsp;</b>" + rpc.fullVersionAndRevision + "<br/><br/>";
                details +="<b>" + i18n._("Timestamp") +":&nbsp;</b>" + (new Date()).toString() + "<br/>";
            }
            
            if (handler==null) {
                Ung.Util.showWarningMessage(message, details);
            } else if(type==null || type== "alertCallback") {
                Ung.Util.showWarningMessage(message, details, handler);
            } else if (type== "alert") {
                Ung.Util.showWarningMessage(message, details);
                handler();
            } else if (type== "noAlert") {
                handler(message, details);
            }
            return !continueExecution;
        }
        return false;
    },
    encode: function (obj) {
        if(obj == null || typeof(obj) != 'object') {
            return obj;
        }
        var msg="";
        var val=null;
        for(var key in obj) {
            val=obj[key];
            if(val!=null) {
              msg+=" | "+key+" - "+val;
            }
        }
        return msg;
    },
    addBuildStampToUrl: function(url) {
        var scriptArgs = "s=" + main.debugMode ? (new Date()).getTime(): main.buildStamp;
        if (url.indexOf("?") >= 0) {
            return url + "&" + scriptArgs;
        } else {
            return url + "?" + scriptArgs;
        }
    },
    getScriptSrc: function(sScriptSrc) {
        //return main.debugMode ? sScriptSrc: sScriptSrc.replace(/\.js$/, "-min.js");
        return sScriptSrc ;
    },
    // Load css file Dynamically
    loadCss: function(filename) {
        var fileref=document.createElement("link");
        fileref.setAttribute("rel", "stylesheet");
        fileref.setAttribute("type", "text/css");
        fileref.setAttribute("href", Ung.Util.addBuildStampToUrl(filename));
        document.getElementsByTagName("head")[0].appendChild(fileref);
    },
    // Load script file Dynamically
    loadScript: function(sScriptSrc, handler) {
        var error=null;
        try {
            var req;
            if(window.XMLHttpRequest) {
                req = new XMLHttpRequest();
            } else {
                req = new ActiveXObject("Microsoft.XMLHTTP");
            }
            req.open("GET",Ung.Util.addBuildStampToUrl(sScriptSrc),false);
            req.send(null);
            if( window.execScript) {
                window.execScript(req.responseText);
            } else {
                eval(req.responseText);
            }
        } catch (e) {
            error=e;
            alert(error);
        }
        if(handler) {
            handler.call(this);
        }
        return error;
    },
    // Load a resource if not loaded and execute a callback function
    loadResourceAndExecute: function(resource,sScriptSrc, handler) {
        if(Ung.hasResource[resource]) {
            handler.call(this);
        } else {
            Ung.Util.loadScript(sScriptSrc, handler);
        }
    },
    loadModuleTranslations: function(moduleName, handler) {
        if(!Ung.i18nModuleInstances[moduleName]) {
            rpc.languageManager.getTranslations(Ext.bind(function(result, exception, opt, moduleName, handler) {
                if(Ung.Util.handleException(exception)) return;
                var moduleMap=result.map;
                Ung.i18nModuleInstances[moduleName] = Ext.create('Ung.ModuleI18N',{
                        "map": i18n.map,
                        "moduleMap": moduleMap
                });
                handler.call(this);
            }, this,[moduleName, handler],true), moduleName);
        } else {
            handler.call(this);
        }
    },
    todo: function() {
        Ext.MessageBox.alert(i18n._("TODO"),"TODO: implement this.");
    },
    getDayOfWeekList: function() {
        var data = [];
        var datacount = 0;
        data[datacount++] = [1, i18n._("Sunday")];
        data[datacount++] = [2, i18n._("Monday")];
        data[datacount++] = [3, i18n._("Tuesday")];
        data[datacount++] = [4, i18n._("Wednesday")];
        data[datacount++] = [5, i18n._("Thursday")];
        data[datacount++] = [6, i18n._("Friday")];
        data[datacount++] = [7, i18n._("Saturday")];
        return data;
    },
    getV4NetmaskList: function( includeNull ) {
        var data = [];
        if (includeNull) data.push( [null,"\u00a0"] );
        data.push( [32,"/32 - 255.255.255.255"] );
        data.push( [31,"/31 - 255.255.255.254"] );
        data.push( [30,"/30 - 255.255.255.252"] );
        data.push( [29,"/29 - 255.255.255.248"] );
        data.push( [28,"/28 - 255.255.255.240"] );
        data.push( [27,"/27 - 255.255.255.224"] );
        data.push( [26,"/26 - 255.255.255.192"] );
        data.push( [25,"/25 - 255.255.255.128"] );
        data.push( [24,"/24 - 255.255.255.0"] );
        data.push( [23,"/23 - 255.255.254.0"] );
        data.push( [22,"/22 - 255.255.252.0"] );
        data.push( [21,"/21 - 255.255.248.0"] );
        data.push( [20,"/20 - 255.255.240.0"] );
        data.push( [19,"/19 - 255.255.224.0"] );
        data.push( [18,"/18 - 255.255.192.0"] );
        data.push( [17,"/17 - 255.255.128.0"] );
        data.push( [16,"/16 - 255.255.0.0"] );
        data.push( [15,"/15 - 255.254.0.0"] );
        data.push( [14,"/14 - 255.252.0.0"] );
        data.push( [13,"/13 - 255.248.0.0"] );
        data.push( [12,"/12 - 255.240.0.0"] );
        data.push( [11,"/11 - 255.224.0.0"] );
        data.push( [10,"/10 - 255.192.0.0"] );
        data.push( [9,"/9 - 255.128.0.0"] );
        data.push( [8,"/8 - 255.0.0.0"] );
        data.push( [7,"/7 - 254.0.0.0"] );
        data.push( [6,"/6 - 252.0.0.0"] );
        data.push( [5,"/5 - 248.0.0.0"] );
        data.push( [4,"/4 - 240.0.0.0"] );
        data.push( [3,"/3 - 224.0.0.0"] );
        data.push( [2,"/2 - 192.0.0.0"] );
        data.push( [1,"/1 - 128.0.0.0"] );
        data.push( [0,"/0 - 0.0.0.0"] );

        return data;
    },
    getInterfaceList: function( wanMatchers, anyMatcher ) {
        var data = [];
        var networkSettings = main.getNetworkSettings();
        for ( var c = 0 ; c < networkSettings.interfaces.list.length ; c++ ) {
            var intf = networkSettings.interfaces.list[c];
            var name = intf.name;
            var key = intf.interfaceId;
            
            data.push( [ key, name ] );
        }
        data.push( [ 250, "OpenVPN" ] );
        
        if (wanMatchers) {
            data.unshift( ["wan",i18n._("Any WAN")] );
            data.unshift( ["non_wan",i18n._("Any Non-WAN")] );
        }
        if (anyMatcher) {
            data.unshift( ["any",i18n._("Any")] );
        }

        return data;
    },
    getInterfaceAddressedList: function() {
        var data = [];
        var networkSettings = main.getNetworkSettings();
        for ( var c = 0 ; c < networkSettings.interfaces.list.length ; c++ ) {
            var intf = networkSettings.interfaces.list[c];
            var name = intf.name;
            var key = intf.interfaceId;
            
            if ( intf.configType == 'ADDRESSED' ) {
                data.push( [ key, name ] );
            }
        }
        return data;
    },
    getInterface: function( networkSettings, interfaceId ) {
        if ( ! networkSettings )
            return null;
        var intfs = networkSettings.interfaces;
        for( var x = 0 ; x < intfs.list.length ; x++) {
            var intf = intfs.list[x];
            if ( intf['interfaceId'] === interfaceId )
                return intf;
        }
        return null;
    },
    getWanList: function() {
        var data = [];
        var networkSettings = main.getNetworkSettings();
        for ( var c = 0 ; c < networkSettings.interfaces.list.length ; c++ ) {
            var intf = networkSettings.interfaces.list[c];
            var name = intf.name;
            var key = intf.interfaceId;
            
            if ( intf.configType == 'ADDRESSED' && intf.isWan) {
                data.push( [ key, name ] );
            }
        }
        return data;
    },
    getInterfaceStore: function(simpleMatchers) {

        var data = [];
        
        // simple Matchers excludes WAN matchers
        if (simpleMatchers)
            data = this.getInterfaceList(false, true);
        else
            data = this.getInterfaceList(true, true);
            
        var interfaceStore=Ext.create('Ext.data.ArrayStore',{
            idIndex:0,
            fields: ['key', 'name'],
            data: data
        });
        return interfaceStore;
    },
    formatTime: function(value, rec) {
        if(value==null) {
            return null;
        } else {
            var d=new Date();
            d.setTime(value.time);
            return d.format("H:i");
        }
    },
    // Test if there is data in the specified object
    hasData: function(obj) {
        var hasData = false;
        for (var id in obj) {
            hasData = true;
            break;
        }
        return hasData;
    },
    // Check if two object are equal
    equals: function(obj1, obj2) {
        // the two objects have different types
        if (typeof obj1 !== typeof obj2) {
            return false;
        }
        // check null objects
        if (obj1 === null || obj2 === null) {
            return obj1 === null && obj2 === null;
        }
        var count = 0;
        for (var prop in obj1) {
            // the two properties have different types
            if (typeof obj1[prop] !== typeof obj2[prop]) {
                return false;
            }

            switch (typeof obj1[prop]) {
              case 'number':
              case 'string':
              case 'boolean':
                if (obj1[prop] !== obj2[prop]) {
                    return false;
                }
                break;
              case 'undefined':
                break;
              case 'object':
                if (!Ung.Util.equals(obj1[prop], obj2[prop])) {
                    return false;
                }
                break;
            }
            count++;
        }

        // check that the two objects have the same number of properties
        for (prop in obj2) {
            count--;
        }
        if (count !== 0) {
            return false;
        }
        return true;
    },

    // Clone object
    clone: function (obj) {
        if(obj === null || typeof(obj) != 'object')
            return obj;

        var temp = new obj.constructor();
        for(var key in obj)
            temp[key] = Ung.Util.clone(obj[key]);

        return temp;
    },
    bytesToMBs: function(value) {
        return Math.round(value/10000)/100;
    },
    resizeWindows: function() {
        Ext.WindowMgr.each(Ung.Util.setSizeToRack);
    },
    setSizeToRack: function (win) {
        if(win && win.sizeToRack) {
            win.setSizeToRack();
        }
    },
    defaultRenderer: function (value) {
        return (typeof value == 'string') ?
           value.length<1? "&#160;": Ext.util.Format.htmlEncode(value):
           value;
    },
    getQueryStringParam: function(name) {
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( window.location.href );
        if( results == null )
            return null;
        else
            return results[1];
    },
    getGenericRuleFields: function(settingsCmp) {
        return [{
                name: 'id'
            }, {
                name: 'name',
                defaultValue:  undefined
            }, {
                name: 'string',
                defaultValue:  undefined
            }, {
                name: 'description',
                defaultValue:  undefined
            }, {
                name: 'category',
                defaultValue:  undefined
            }, {
                name: 'enabled',
                defaultValue: 'true'
            }, {
                name: 'blocked',
                defaultValue:  undefined
            }, {
                name: 'flagged',
                defaultValue:  undefined
            }];
    },
    buildJsonListFromStrings: function(stringsList, propertyName) {
          var jsonList=[];
          if(stringsList != null && stringsList.length>0) {
              for(var i=0; i<stringsList.length; i++) {
                  var el={};
                  el[propertyName]=stringsList[i];
                  jsonList.push(el);
              }
          }
          return jsonList;
    },
    makeDataFn: function(dataProperty, dataFn, dataFnArgs) {
        return function(forceReloadOrHandler) {
            if (forceReloadOrHandler !== undefined || dataProperty === undefined) {
                if(Ext.isFunction(forceReloadOrHandler)) {
                    dataFn(Ext.bind(function(result, exception) {
                        if(Ung.Util.handleException(exception)) return;
                        dataProperty = result;
                        forceReloadOrHandler.call(this);
                    }, this, dataFnArgs, true));
                } else {
                    try {
                        dataProperty = dataFn(dataFnArgs);
                    } catch (e) {
                        Ung.Util.rpcExHandler(e);
                    }
                }
            }
            return dataProperty;
        };
    },
    createStoreMap : function(pairArray) {
        var map = {};
        for(var i=0; i<pairArray.length; i++) {
            map[pairArray[i][0]] = pairArray[i][1];
        }
        return map;
    },
    createRecordsMap : function(recList, property) {
        var map = {};
        for(var i=0; i<recList.length; i++) {
            map[recList[i][property]] = recList[i];
        }
        return map;
    },
    maxRowCount: 2147483647,
    timestampFieldWidth: 135,
    ipFieldWidth: 100,
    portFieldWidth: 70,
    hostnameFieldWidth: 120,
    uriFieldWidth: 200,
    usernameFieldWidth: 120,
    booleanFieldWidth: 60,
    emailFieldWidth: 150
};

Ung.Util.RetryHandler = {
    /**
     * retryFunction
     * @param fn Remote call to execute.
     * @param fnScope Scope to use when calling fn.
     * @param params array of parameters to pass to fn.
     * @param callback Callback to execute on success.
     * @param timeout Delay to wait until retrying the call.
     * @param count Number of retries remaining.
     */
    retry: function( fn, fnScope, params, callback, timeout, count ) {
        var input = {
            "fn": fn,
            "fnScope": fnScope,
            "params": params,
            "callback": callback,
            "timeout": timeout,
            "count": count
        };
        this.callFunction( input );
    },

    completeRetry: function( result, exception, input ) {
        var handler = Ext.bind(this.tryAgain, this, [ exception, input ] );
        var type = "noAlert";

        var count = input.count;

        // Do not retry any more
        if (( count == null ) || ( count < 1 )) {
            handler = null;
            type = null;
        } else {
            input.count--;
        }

        if ( Ung.Util.handleException( exception, handler, type )) {
            return;
        }

        input.callback( result, exception );
    },

    tryAgain: function( exception, input ) {
        if( exception.code == 500 ) {
            // If necessary try calling the function again.
            window.setTimeout( Ext.bind(this.callFunction, this, [ input ] ), input.timeout );
            return;
        }

        var message = exception.message;
        if (message == null || message == "Unknown" || message === "") {
            message = i18n._("Please Try Again");
            if (exception.javaStack != null)
                message += "<br/><br/>" + exception.javaStack;
        }
        Ext.MessageBox.alert(i18n._("Warning"), message);
    },

    callFunction: function( input ) {
        var d = Ext.bind(this.completeRetry, this, [ input ], 2 );
        var fn = input.fn;
        var fnScope = input.fnScope;
        var params = [ d ];

        if ( input.params ) {
            params = params.concat( input.params );
        }

        fn.apply( fnScope, params );
    }
};

// Defines custom sorting (casting?) comparison functions used when sorting data.
Ung.SortTypes = {
    /**
     * Timestamp sorting
     * @param {Mixed} value The value being converted
     * @return {Number} The comparison value
     */
    asTimestamp: function(value) {
        return value.time;
    },
    /**
     * @param {Mixed} value The SessionEvent value being converted
     * @return {String} The comparison value
     */
    asClient: function(value) {
        return value === null ? "": value.c_client_addr + ":" + value.c_client_port;
    },
    /**
     * @param {Mixed} value The SessionEvent value being converted
     * @return {String} The comparison value
     */
    asServer: function(value) {
        return value === null ? "": value.s_server_addr + ":" + value.s_server_port;
    },
    /**
     * @param value of the UID for users / groups
     * @reutrn the comparison value
     */
    asUID: function (value) {
        if ( value == "[any]" || value == "[authenticated]" || value == "[unauthenticated]" ) {
            return "";
        }
        return value;
    },
    /**
     * @param value of the last name field - if no value is given it is pushed to the last.
     */
    asLastName: function (value) {
        if(Ext.isEmpty(value)) {
            return null;
        }
        return value;
    }
};

// resources map
Ung.hasResource = {};

Ext.define("Ung.ConfigItem", {
    extend: "Ext.Component",
    item: null,
    renderTo: 'configItems',
    autoEl: 'div',
    constructor: function(config) {
        this.id = "configItem_" + config.item.name;
        this.callParent(arguments);
    },
    afterRender: function() {
        this.callParent(arguments);
        var html = Ung.ConfigItem.template.applyTemplate({
            'iconCls': this.item.iconClass,
            'text': this.item.displayName
        });
        this.getEl().insertHtml("afterBegin", Ung.AppItem.buttonTemplate.applyTemplate({content:html}));
        this.getEl().addCls("app-item");
        this.getEl().on("click", this.onClick, this);
    },
    onClick: function(e) {
        if (e!=null) {
            e.stopEvent();
        }
        if(this.item.handler!=null) {
            this.item.handler.call(this, this.item);
        } else {
            Ext.MessageBox.alert(i18n._("Warning"),"TODO: implement config "+this.item.name);
        }
    },
    setIconCls: function(iconCls) {
        this.getEl().down("div[name=iconCls]").dom.className=iconCls;
    }
});
Ung.ConfigItem.template = new Ext.Template(
    '<div class="icon"><div name="iconCls" class="{iconCls}"></div></div>', '<div class="text text-center">{text}</div>');

Ext.define("Ung.AppItem", {
    extend: "Ext.Component",
    nodeProperties: null,
    iconSrc: null,
    iconCls: null,
    autoEl: 'div',
    state: null,
    // progress bar component
    progressBar: null,
    subCmps:null,
    download: null,
    constructor: function( nodeProperties, renderPosition) {
        this.subCmps=[];
        this.nodeProperties = nodeProperties;
        this.id = "app-item_" + this.nodeProperties.displayName;
        this.callParent(arguments);
        this.render('appsItems',renderPosition);
    },
    afterRender: function() {
        this.callParent(arguments);

        if (this.nodeProperties.name && this.getEl()) {
            this.getEl().set({
                'name': this.nodeProperties.name
            });
        }
        var imageHtml = null;
        if (this.iconCls == null) {
            if (this.iconSrc == null) {
                this.iconSrc = 'chiclet?name=' + this.nodeProperties.name;
            }
            imageHtml = '<img src="' + this.iconSrc + '" style="vertical-align: middle;"/>';
        } else {
            imageHtml = '<div class="' + this.iconCls + '"></div>';
        }
        var html = Ung.AppItem.template.applyTemplate({
            id: this.getId(),
            'imageHtml': imageHtml,
            'text': this.nodeProperties.displayName
        });
        this.getEl().insertHtml("afterBegin", Ung.AppItem.buttonTemplate.applyTemplate({content:html}));
        this.getEl().addCls("app-item");

        this.progressBar = Ext.create('Ext.ProgressBar',{
            id: 'progressBar_' + this.getId(),
            renderTo: "state_" + this.getId(),
            height: 17,
            width: 140,
            waitDefault: function(updateText) {
                this.reset();
                this.wait({
                    text:  updateText,
                    interval: 100,
                    increment: 15
                });
            }
        });

        this.actionEl = Ext.get("action_" + this.getId());
        this.progressBar.hide();
        if( this.nodeProperties.name != null ) { // FIXME
            this.getEl().on("click", this.installNodeFn, this);
            this.actionEl.insertHtml("afterBegin", i18n._("Install"));
            this.actionEl.addCls("icon-arrow-install");
        } else {
            return;
            // error
        }
        var appsLastState=main.appsLastState[this.nodeProperties.displayName];
        if(appsLastState!=null) {
            this.download=appsLastState.download;
            this.setState(appsLastState.state,appsLastState.options);
        }
    },
    // hack because I cant figure out how to tell extjs to apply style to progress text
    stylizeProgressText: function (str) {
        return '<p style="font-size:xx-small;text-align:left;align:left;padding-left:5px;margin:0px;">' + str + '</p>';
    },
    // set the state of the progress bar
    setState: function(newState, options) {
        var progressString = "";
        var currentPercentComplete;
        var progressIndex;
        switch (newState) {
          case null:
          case "installed":
            this.displayButtonsOrProgress(true);
            this.download=null;
            break;
          case "loadapp":
            this.displayButtonsOrProgress(false);
            progressString = this.stylizeProgressText(i18n._("Loading App..."));
            this.progressBar.waitDefault(progressString);
            break;
        default:
            Ext.MessageBox.alert(i18n._("Warning"),"Unknown state: " + newState);
        }
        this.state = newState;

    },

    // before Destroy
    beforeDestroy: function() {
        this.actionEl.removeAllListeners();
        this.progressBar.reset(true);
        this.progressBar.destroy();
        Ext.each(this.subCmps, Ext.destroy);
        this.callParent(arguments);
    },

    // display Buttons xor Progress barr
    displayButtonsOrProgress: function(displayButtons) {
        this.actionEl.setVisible(displayButtons);
        if (displayButtons) {
            this.getEl().unmask();
            this.progressBar.reset(true);
        } else {
            this.getEl().mask();
            if(!this.progressBar.isVisible()) {
                this.progressBar.show();
            }
        }
    },
    // install node / uninstall App
    installNodeFn: function(e) {
        e.preventDefault();
        if(!this.progressBar.hidden) {
            return;
        }
        main.installNode(this.nodeProperties, this);
    }

});
Ung.AppItem.template = new Ext.Template('<div class="icon">{imageHtml}</div>', '<div class="text">{text}</div>', '<div id="action_{id}" class="action"></div>', '<div class="state-pos" id="state_{id}"></div>');
Ung.AppItem.buttonTemplate = new Ext.Template('<table cellspacing="0" cellpadding="0" border="0" style="width: 100%; height:100%"><tbody><tr><td class="app-item-left"></td><td class="app-item-center">{content}</td><td class="app-item-right"></td></tr></tbody></table>');
// update state for the app with a displayName
Ung.AppItem.updateState = function(displayName, state, options) {
    var app = Ung.AppItem.getApp(displayName);
    main.setAppLastState(displayName, state, options, app!=null?app.download:null);
    if (app != null) {
        app.setState(state, options);
    }
};
// get the app item having a item name
Ung.AppItem.getApp = function(displayName) {
    if (main.apps !== null) {
        return Ext.getCmp("app-item_" + displayName);
    }
    return null;
};

// Node Class
Ext.define("Ung.Node", {
    extend: "Ext.Component",
    statics: {
        // Get node component by nodeId
        getCmp: function(nodeId) {
            return Ext.getCmp("node_" + nodeId);
        },
        getStatusTip: function() {
            return [
                '<div style="text-align: left;">',
                i18n._("The <B>Status Indicator</B> shows the current operating condition of a particular application."),
                '<BR>',
                '<font color="#00FF00"><b>' + i18n._("Green") + '</b></font> ' +
                i18n._('indicates that the application is "on" and operating normally.'),
                '<BR>',
                '<font color="#FF0000"><b>' + i18n._("Red") + '</b></font> ' +
                i18n._('indicates that the application is "on", but that an abnormal condition has occurred.'),
                '<BR>',
                '<font color="#FFFF00"><b>' + i18n._("Yellow") + '</b></font> ' +
                i18n._('indicates that the application is saving or refreshing settings.'), '<BR>',
                '<b>' + i18n._("Clear") + '</b> ' + i18n._('indicates that the application is "off", and may be turned "on" by the user.'),
                '</div>'].join('');
        },
        getPowerTip: function() {
            return i18n._('The <B>Power Button</B> allows you to turn a application "on" and "off".');
        },
        getNonEditableNodeTip: function () {
            return i18n._('This app belongs to the parent rack shown above.<br/> To access the settings for this app, select the parent rack.'); 
        },
        template: new Ext.Template('<div class="node-cap" style="display:{isNodeEditable}"></div><div class="node-image"><img src="{image}"/></div>', '<div class="node-label">{displayName}</div>',
            '<div class="node-faceplate-info">{licenseMessage}</div>',
            '<div class="node-metrics" id="node-metrics_{id}"></div>',
            '<div class="node-state" id="node-state_{id}" name="State"></div>',
            '<div class="{nodePowerCls}" id="node-power_{id}" name="Power"></div>',
            '<div class="node-buttons" id="node-buttons_{id}"></div>')
    },    
    autoEl: "div",
    cls: "node",
    // ---Node specific attributes------
    // node name
    name: null,
    // node image
    image: null,
    // mackage description
    md: null,
    // --------------------------------
    hasPowerButton: null,
    // node state
    state: null, // on, off, attention, stopped
    // is powered on,
    powerOn: null,
    // running state
    runState: null, // RUNNING, INITIALIZED

    // settings Component
    settings: null,
    // settings Window
    settingsWin: null,
    // settings Class name
    settingsClassName: null,
    // list of available metrics for this node/app
    metrics: null,
    // which metrics are shown on the facebplate
    activeMetrics: [0,1,2,3],
    faceplateMetrics: null,
    buttonsPanel: null,
    subCmps: null,
    //can the node be edited on the gui
    isNodeEditable: true,
    constructor: function(config) {
        this.id = "node_" + config.nodeSettings.id;
        config.helpSource=config.displayName.toLowerCase().replace(/ /g,"_");
        if(config.runState==null) {
            config.runState="INITIALIZED";
        }
        this.subCmps = [];
        if( config.nodeSettings.policyId != null ) {
            this.isNodeEditable = (config.nodeSettings.policyId == rpc.currentPolicy.policyId);
        }
        this.callParent(arguments);
    },
    // before Destroy
    beforeDestroy: function() {
        this.getEl().stopAnimation();
        if(this.settingsWin && this.settingsWin.isVisible()) {
            this.settingsWin.closeWindow();
        }
        Ext.each(this.subCmps, Ext.destroy);
        if(this.hasPowerButton) {
            Ext.get('node-power_' + this.getId()).removeAllListeners();
        }
        this.callParent(arguments);
    },
    afterRender: function() {
        this.callParent(arguments);
        main.removeNodePreview(this.name);

        this.getEl().set({
            'viewPosition': this.viewPosition
        });
        this.getEl().set({
            'name': this.displayName
        });
        if(this.fadeIn) {
            var el=this.getEl();
            el.scrollIntoView(Ext.getCmp("center").body);
            el.setOpacity(0.5);
            el.fadeIn({opacity: 1, duration: 2500, callback: function() {
                el.setOpacity(1);
                el.frame("#63BE4A", 1, { duration: 1000 });
            }});
        }
        var nodeButtons=[{
            xtype: "button",
            name: "Show Settings",
            iconCls: 'node-settings-icon',
            text: i18n._('Settings'),
            handler: Ext.bind(function() {
                this.onSettingsAction();
            }, this)
        },{
            xtype: "button",
            name: "Help",
            iconCls: 'icon-help',
            minWidth: 25,
            //text: i18n._('Help'),
            handler: Ext.bind(function() {
                this.onHelpAction();
            }, this)
        },{
            xtype: "button",
            name: "Buy",
            id: 'node-buy-button_'+this.getId(),
            iconCls: 'icon-buy',
            hidden: !(this.license != null && this.license.trial), //show only if trial license
            ctCls:'buy-button-text',
            text: '<font color="green">' + i18n._('Buy Now') + '</font>',
            handler: Ext.bind(this.onBuyNowAction, this)
        }];
        var templateHTML = Ung.Node.template.applyTemplate({
            'id': this.getId(),
            'image': this.image,
            'isNodeEditable': this.isNodeEditable ? "none": "",
            'displayName': this.displayName,
            'nodePowerCls': this.hasPowerButton?((this.license && !this.license.valid)?"node-power-expired":"node-power"):"",
            'licenseMessage': this.getLicenseMessage()
        });
        this.getEl().insertHtml("afterBegin", templateHTML);

        this.buttonsPanel=Ext.create('Ext.panel.Panel',{
            renderTo: 'node-buttons_' + this.getId(),
            border: false,
            bodyStyle: 'background-color: transparent;',
            width: 290,
            buttonAlign: "left",
            layout: 'table',
            layoutConfig: {
                columns: 3
            },
            buttons: nodeButtons
        });
        this.subCmps.push(this.buttonsPanel);
        if(this.hasPowerButton) {
            Ext.get('node-power_' + this.getId()).on('click', this.onPowerClick, this);
            this.subCmps.push(new Ext.ToolTip({
                html: Ung.Node.getStatusTip(),
                target: 'node-state_' + this.getId(),
                autoWidth: true,
                showDelay: 20,
                dismissDelay: 0,
                hideDelay: 0
            }));
            this.subCmps.push(new Ext.ToolTip({
                html: Ung.Node.getPowerTip(),
                target: 'node-power_' + this.getId(),
                autoWidth: true,
                showDelay: 20,
                dismissDelay: 0,
                hideDelay: 0
            }));
            if(!this.isNodeEditable) {
                this.subCmps.push(new Ext.ToolTip({
                    html: Ung.Node.getNonEditableNodeTip(),
                    target: 'node_' + this.nodeId,
                    autoWidth: true,
                    showDelay: 20,
                    dismissDelay: 0,
                    hideDelay: 0
                }));                
            }
        }
        this.updateRunState(this.runState, true);
        this.initMetrics();
    },
    // is runState "RUNNING"
    isRunning: function() {
      return (this.runState == "RUNNING");
    },
    setState: function(state) {
        this.state = state;
        if(this.hasPowerButton) {
            document.getElementById('node-state_' + this.getId()).className = "node-state icon-state-" + this.state;
        }
    },
    setPowerOn: function(powerOn) {
        this.powerOn = powerOn;
    },
    updateRunState: function(runState, force) {
        if(runState!=this.runState || force) {
            this.runState = runState;
            switch ( runState ) {
              case "RUNNING":
                this.setPowerOn(true);
                this.setState("on");
                break;
              case "INITIALIZED":
              case "LOADED":
                this.setPowerOn(false);
                this.setState("off");
                break;
            default:
                alert("Unknown runState: " + runState);
            }
        }
    },
    updateMetrics: function() {
        if (this.powerOn && this.metrics) {
            if(this.faceplateMetrics!=null) {
                this.faceplateMetrics.update(this.metrics);
            }
        } else {
            this.resetMetrics();
        }
    },
    resetMetrics: function() {
        if(this.faceplateMetrics!=null) {
            this.faceplateMetrics.reset();
        }
    },
    onPowerClick: function() {
        if (!this.powerOn) {
            this.start();
        } else {
            this.stop();
        }
    },
    start: function () {
        if(this.state=="attention") {
          return;
        }
        this.loadNode(Ext.bind(function() {
            this.setPowerOn(true);
            this.setState("attention");
            this.rpcNode.start(Ext.bind(function(result, exception) {
                if(Ung.Util.handleException(exception, Ext.bind(function(message, details) {
                    var title = Ext.String.format( i18n._( "Unable to start {0}" ), this.displayName );
                    Ung.Util.showWarningMessage(title, details);
                }, this),"noAlert")) return;
                this.rpcNode.getRunState(Ext.bind(function(result, exception) {
                    if(Ung.Util.handleException(exception)) return;
                    this.updateRunState(result);
                }, this));
            }, this));
        }, this));
    },
    stop: function () {
        if(this.state=="attention") {
            return;
        }
        this.loadNode(Ext.bind(function() {
            this.setPowerOn(false);
            this.setState("attention");
            this.rpcNode.stop(Ext.bind(function(result, exception) {
                this.resetMetrics();
                if(Ung.Util.handleException(exception)) return;
                this.rpcNode.getRunState(Ext.bind(function(result, exception) {
                    if(Ung.Util.handleException(exception)) return;
                    this.updateRunState(result);
                }, this));
            }, this));
        }, this));
    },
    // on click help
    onHelpAction: function() {
        main.openHelp(this.helpSource);
    },
    // on click settings
    onSettingsAction: function() {
        this.loadSettings();
    },
    //on Buy Now Action
    onBuyNowAction: function() {
        main.openLibItemStore( this.name.replace("-node-","-libitem-"), Ext.String.format(i18n._("More Info - {0}"), this.displayName) );
    },
    getNode: function(handler) {
        if(handler==null) {handler=Ext.emptyFn;}
        if (this.rpcNode === undefined) {
            try {
                this.rpcNode = rpc.nodeManager.node(this.nodeSettings["id"]);
            } catch (e) {
                Ung.Util.rpcExHandler(e);
            }
            handler.call(this);
        } else {
            handler.call(this);
        }
    },
    getNodeProperties: function(handler) {
        if(handler==null) {handler=Ext.emptyFn;}
        if(this.rpcNode == null) {
            return;
        }
        if (this.nodeProperties === undefined) {
            this.rpcNode.getNodeProperties(Ext.Function.createSequence(Ext.bind(function(result, exception) {
                if(Ung.Util.handleException(exception)) return;
                this.nodeProperties = result;
            }, this), handler));
        } else {
            handler.call(this);
        }
    },
    // load Node
    loadNode: function(handler) {
        if(handler==null) {handler=Ext.emptyFn;}
        Ext.bind(this.getNode, this,[Ext.bind(this.getNode, this,[Ext.bind(this.getNodeProperties, this,[handler])])]).call(this);
    },
    
    loadSettings: function() {
        Ext.MessageBox.wait(i18n._("Loading Settings..."), i18n._("Please wait"));
        this.settingsClassName = Ung.NodeWin.getClassName(this.name);
        if (!this.settingsClassName) {
            // Dynamically load node javaScript
            Ung.NodeWin.loadNodeScript(this, Ext.bind(function() {
                this.settingsClassName = Ung.NodeWin.getClassName(this.name);
                this.initSettings();
            }, this));
        } else {
            this.initSettings();
        }
    },
    // init settings
    initSettings: function() {
        Ext.bind(this.loadNode, this,[Ext.bind(this.initSettingsTranslations, this,[Ext.bind(this.preloadSettings, this)])]).call(this);
    },
    initSettingsTranslations: function(handler) {
        Ung.Util.loadModuleTranslations.call(this, this.name, handler);
    },
    //get node settings async before node settings load
    preloadSettings: function(handler) {
        if(Ext.isFunction(this.rpcNode.getSettings)) {
            this.rpcNode.getSettings(Ext.bind(function(result, exception) {
                if(Ung.Util.handleException(exception)) return;
                this.openSettings.call(this, result);
            }, this));
        } else {
            this.openSettings.call(this, null);
        }
    },
    // open settings window
    openSettings: function(settings) {
        var items=null;
        if (this.settingsClassName !== null) {
            this.settingsWin=Ext.create(this.settingsClassName, {'node':this,'tid':this.nodeId,'name':this.name, 'settings': settings});
        } else {
            this.settingsWin = Ext.create('Ung.NodeWin',{
                node: this,
                items: [{
                    anchor: '100% 100%',
                    cls: 'description',
                    bodyStyle: "padding: 15px 5px 5px 15px;",
                    html: Ext.String.format(i18n._("Error: There is no settings class for the node '{0}'."), this.name)
                }]
            });
        }
        this.settingsWin.addListener("hide", Ext.bind(function() {
            if ( Ext.isFunction(this.beforeClose)) {
                this.beforeClose();
            }
            this.destroy();
        }, this.settingsWin));
        this.settingsWin.show();
        Ext.MessageBox.hide();
    },

    // remove node
    removeAction: function() {
        /* A hook for doing something in a node before attempting to remove it */
        if ( this.preRemoveAction ) {
            this.preRemoveAction( this, Ext.bind(this.completeRemoveAction, this ));
            return;
        }

        this.completeRemoveAction();
    },

    completeRemoveAction: function() {
        var message = Ext.String.format(
                i18n._("{0} is about to be removed from the rack.\nIts settings will be lost and it will stop processing network traffic.\n\nWould you like to continue removing?"), this.displayName);
        Ext.Msg.confirm(i18n._("Warning:"), message, Ext.bind(function(btn, text) {
            if (btn == 'yes') {
                if (this.settingsWin) {
                    this.settingsWin.closeWindow();
                }
                this.setState("attention");
                this.getEl().mask();
                this.getEl().fadeOut({ opacity: 0.1, duration: 2500, remove: false, useDisplay:false});
                rpc.nodeManager.destroy(Ext.bind(function(result, exception) {
                    if(Ung.Util.handleException(exception, Ext.bind(function() {
                        this.getEl().unmask();
                        this.getEl().stopAnimation();
                    }, this),"alert")) return;
                    if (this) {
                        if(this.getEl()) {
                            this.getEl().stopAnimation();    
                        }
                        var nodeName = this.name;
                        var cmp = this;
                        Ext.destroy(cmp);
                        cmp = null;
                        for (var i = 0; i < main.nodes.length; i++) {
                            if (nodeName == main.nodes[i].name) {
                                main.nodes.splice(i, 1);
                                break;
                            }
                        }
                    }
                    main.updateRackView();
                }, this), this.nodeId);
            }
        }, this));
    },
    // initialize faceplate metrics
    initMetrics: function() {
        if(this.metrics != null && this.metrics.list != null) {
            if( this.metrics.list.length > 0 ) {
                this.faceplateMetrics = Ext.create('Ung.FaceplateMetric', {
                    nodeName: this.name,
                    parentId: this.getId(),
                    parentNodeId: this.nodeId,
                    metrics: this.metrics
                });
                this.faceplateMetrics.render('node-metrics_' + this.getId());
                this.subCmps.push(this.faceplateMetrics);
            }
        }
            
    },
    getLicenseMessage: function() {
        var licenseMessage = "";
        if (!this.license) {
            return licenseMessage;
        }
        if(this.license.trial) {
            if(this.license.expired) {
                licenseMessage = i18n._("Free trial expired!");
            } else if (this.license.daysRemaining < 2) {
                licenseMessage = i18n._("Free trial.") + " " + i18n._("Expires today.");
            } else if (this.license.daysRemaining < 32) {
                licenseMessage = i18n._("Free trial.") + " " + Ext.String.format("{0} ", this.license.daysRemaining) + i18n._("days remain.");
            } else {
                licenseMessage = i18n._("Free trial.");
            }
        } else { // not a trial
            if (this.license.valid) { 
                // if its valid - say if its close to expiring otherwise say nothing
                // if (this.license.daysRemaining < 5) {
                //     licenseMessage = i18n._("Expires in") + Ext.String.format(" {0} ", this.license.daysRemaining) + i18n._("days");
                // } 
            } else {
                // if its invalid say the reason
                licenseMessage = this.license.status;
            }
        }
        return licenseMessage;
    },
    updateLicense: function (license) {
        this.license=license;
        this.getEl().down("div[class=node-faceplate-info]").dom.innerHTML=this.getLicenseMessage();
        document.getElementById("node-power_"+this.getId()).className=this.hasPowerButton?(this.license && !this.license.valid)?"node-power-expired":"node-power":"";
        var nodeBuyButton=Ext.getCmp("node-buy-button_"+this.getId());
        if(nodeBuyButton) {
            if(this.license && this.license.trial) {
                nodeBuyButton.show();
            } else {
                nodeBuyButton.hide();
            }
        }
    }
});

Ext.define("Ung.NodePreview", {
    extend: "Ext.Component",
    autoEl: 'div',
    cls: 'node',
    constructor: function(config) {
        this.id = "node_preview_" + config.name;
        this.callParent(arguments);
    },
    afterRender: function() {
        this.getEl().addCls("node");
        this.getEl().set({
            'viewPosition': this.viewPosition
        });
        var templateHTML = Ung.NodePreview.template.applyTemplate({
            'id': this.getId(),
            'image': 'chiclet?name='+this.name,
            'displayName': this.displayName
        });
        this.getEl().insertHtml("afterBegin", templateHTML);
        this.getEl().scrollIntoView(Ext.getCmp("center").body);
        this.getEl().setOpacity(0.1);
        this.getEl().fadeIn({ opacity: 0.6, duration: 12000});
    },
    beforeDestroy: function() {
        this.getEl().stopAnimation();
        this.callParent(arguments);
    }
});
Ung.NodePreview.template = new Ext.Template('<div class="node-image"><img src="{image}"/></div>', '<div class="node-label">{displayName}</div>');

// Metric Manager object
Ung.MetricManager = {
    // update interval in millisecond
    updateFrequency: 3000,
    started: false,
    intervalId: null,
    cycleCompleted: true,
    downloadSummary: null,
    downloadsComplete: 0,
    historyMaxSize:100,
    messageHistory:[], // for debug info
    firstToleratedError: null,
    errorToleranceInterval: 300000, //5 minutes

    start: function(now) {
        this.stop();
        if(now) {
            Ung.MetricManager.run();
        }
        this.setFrequency(this.updateFrequency);
        this.started = true;
    },
    setFrequency: function(timeMs) {
        this.currentFrequency = timeMs;
        if (this.intervalId !== null) {
            window.clearInterval(this.intervalId);
        }
        this.intervalId = window.setInterval(function() {Ung.MetricManager.run();}, timeMs);
    },
    stop: function() {
        if (this.intervalId !== null) {
            window.clearInterval(this.intervalId);
        }
        this.cycleCompleted = true;
        this.started = false;
    },
    run: function () {
        if (!this.cycleCompleted) {
            return;
        }
        this.cycleCompleted = false;
        rpc.metricManager.getMetricsAndStats(Ext.bind(function(result, exception) {

            if(Ung.Util.handleException(exception, Ext.bind(function() {
                //Tolerate Error 500: Internal Server Error after an install
                //Keep silent for maximum 5 minutes of sequential error messages
                //because apache may reload
                if ( exception.code == 500 || exception.code == 12031 ) {
                    if(this.firstToleratedError==null) {
                        this.firstToleratedError=(new Date()).getTime();
                        this.cycleCompleted = true;
                        return;
                    } else if( ((new Date()).getTime() - this.firstToleratedError ) < this.errorToleranceInterval ) {
                        this.cycleCompleted = true;
                        return;
                    }
                }
                /* After a hostname change and the certificate is regenerated. */
                else if ( exception.code == 12019 ) {
                    Ext.MessageBox.alert(i18n._("System Busy"), "Please refresh the page", Ext.bind(function() {
                        this.cycleCompleted = true;
                    }, this));
                    return;
                }
                
                // otherwise call handleException but without "noAlert"
                Ung.Util.handleException(exception, Ext.bind(function() {
                    this.cycleCompleted = true;
                }, this));
                
            }, this),"noAlert")) return;
            this.firstToleratedError=null; //reset error tolerance on a good response
            this.cycleCompleted = true;

            // update system stats
            main.systemStats.update(result.systemStats);
            // upgrade node metrics
            for (i = 0; i < main.nodes.length; i++) {
                var nodeCmp = Ung.Node.getCmp(main.nodes[i].nodeId);
                if (nodeCmp && nodeCmp.isRunning()) {
                    nodeCmp.metrics = result.metrics[main.nodes[i].nodeId];
                    nodeCmp.updateMetrics();
                }
            }

        }, this));
    }
};
Ext.define("Ung.SystemStats", {
    extend: "Ext.Component",
    autoEl: 'div',
    renderTo: "rack-list",
    constructor: function(config) {
        this.id = "system_stats";
        this.callParent(arguments);
    },
    afterRender: function() {
        this.callParent(arguments);
        this.getEl().addCls("system-stats");
        var contentSystemStatsArr=[
            '<div class="label" style="width:100px;left:0px;">'+i18n._("Network")+'</div>',
            '<div class="label" style="width:70px;left:103px;" onclick="main.showSessions()">'+i18n._("Sessions")+'</div>',
            '<div class="label" style="width:70px;left:173px;">'+i18n._("CPU Load")+'</div>',
            '<div class="label" style="width:75px;left:250px;">'+i18n._("Memory")+'</div>',
            '<div class="label" style="width:40px;right:-5px;">'+i18n._("Disk")+'</div>',
            '<div class="network"><div class="tx">'+i18n._("Tx:")+'<div class="tx-value"></div></div><div class="rx">'+i18n._("Rx:")+'<div class="rx-value"></div></div></div>',
            '<div class="sessions" onclick="main.showSessions()"></div>',
            '<div class="cpu"></div>',
            '<div class="memory"><div class="free">'+i18n._("F:")+'<div class="free-value"></div></div><div class="used">'+i18n._("U:")+'<div class="used-value"></div></div></div>',
            '<div class="disk"><div name="disk_value"></div></div>'
        ];
        this.getEl().insertHtml("afterBegin", contentSystemStatsArr.join(''));

        // network tooltip
        var networkArr=[
            '<div class="title">'+i18n._("TX Speed:")+'</div>',
            '<div class="values"><span name="tx_speed"></span></div>',
            '<div class="title">'+i18n._("RX Speed:")+'</div>',
            '<div class="values"><span name="rx_speed"></span></div>'
        ];
        this.networkToolTip= Ext.create('Ext.tip.ToolTip',{
            target: this.getEl().down("div[class=network]"),
            dismissDelay: 0,
            hideDelay: 400,
            width: 330,
            cls: 'extended-stats',
            renderTo: Ext.getBody(),
            html: networkArr.join('')
        });

        // sessions tooltip
        var sessionsArr=[
            '<div class="title">'+i18n._("Total Sessions:")+'</div>',
            '<div class="values"><span name="totalSessions"></span></div>',
            '<div class="title">'+i18n._("TCP Sessions:")+'</div>',
            '<div class="values"><span name="uvmTCPSessions"></span></div>',
            '<div class="title">'+i18n._("UDP Sessions:")+'</div>',
            '<div class="values"><span name="uvmUDPSessions"></span></div>'
        ];
        this.sessionsToolTip= Ext.create('Ext.tip.ToolTip',{
            target: this.getEl().down("div[class=sessions]"),
            dismissDelay: 0,
            hideDelay: 1000,
            width: 330,
            cls: 'extended-stats',
            renderTo: Ext.getBody(),
            html: sessionsArr.join('')
        });

        // cpu tooltip
        var cpuArr=[
            '<div class="title">'+i18n._("Number of Processors / Type / Speed:")+'</div>',
            '<div class="values"><span name="num_cpus"></span>, <span name="cpu_model"></span>, <span name="cpu_speed"></span></div>',
            '<div class="title">'+i18n._("Load average (1 min , 5 min , 15 min):")+'</div>',
            '<div class="values"><span name="load_average_1_min"></span>, <span name="load_average_5_min"></span>, <span name="load_average_15_min"></span></div>',

            '<div class="title">'+i18n._("Tasks (Processes)")+'</div>',
            '<div class="values"><span name="tasks"></span>'+'</div>',
            '<div class="title">'+i18n._("Uptime:")+'</div>',
            '<div class="values"><span name="uptime"></span></div>'
        ];
        this.cpuToolTip= Ext.create('Ext.tip.ToolTip',{
            target: this.getEl().down("div[class=cpu]"),
            dismissDelay: 0,
            hideDelay: 400,
            width: 330,
            cls: 'extended-stats',
            renderTo: Ext.getBody(),
            html: cpuArr.join('')
        });

        // memory tooltip
        var memoryArr=[
            '<div class="title">'+i18n._("Total Memory:")+'</div>',
            '<div class="values"><span name="memory_total"></span> MB</div>',
            '<div class="title">'+i18n._("Memory Used:")+'</div>',
            '<div class="values"><span name="memory_used"></span> MB, <span name="memory_used_percent"></span> %</div>',
            '<div class="title">'+i18n._("Memory Free:")+'</div>',
            '<div class="values"><span name="memory_free"></span> MB, <span name="memory_free_percent"></span> %</div>',
            '<div class="title">'+i18n._("Swap Files:")+'</div>',
            '<div class="values"><span name="swap_total"></span> MB '+i18n._("total swap space")+' (<span name="swap_used"></span> MB '+i18n._("used")+')</div>'
        ];
        this.memoryToolTip= Ext.create('Ext.tip.ToolTip',{
            target: this.getEl().down("div[class=memory]"),
            dismissDelay: 0,
            hideDelay: 400,
            width: 330,
            cls: 'extended-stats',
            renderTo: Ext.getBody(),
            html: memoryArr.join('')
        });

        // disk tooltip
        var diskArr=[
            '<div class="title">'+i18n._("Total Disk Space:")+'</div>',
            '<div class="values"><span name="total_disk_space"></span> GB</div>',
            '<div class="title">'+i18n._("Free Disk Space:")+'</div>',
            '<div class="values"><span name="free_disk_space"></span> GB</div>',
            '<div class="title">'+i18n._("Data read:")+'</div>',
            '<div class="values"><span name="disk_reads"></span> MB, <span name="disk_reads_per_second"></span> b/sec</div>',
            '<div class="title">'+i18n._("Data write:")+'</div>',
            '<div class="values"><span name="disk_writes"></span> MB, <span name="disk_writes_per_second"></span> b/sec</div>'
        ];
        this.diskToolTip = Ext.create('Ext.tip.ToolTip',{
            target: this.getEl().down("div[class=disk]"),
            dismissDelay: 0,
            hideDelay: 400,
            width: 330,
            cls: 'extended-stats',
            renderTo: Ext.getBody(),
            html: diskArr.join('')
        });

    },
    update: function(stats) {
        var toolTipEl;
        var sessionsText = '<font color="#55BA47">' + stats.uvmSessions + "</font>";
        this.getEl().down("div[class=sessions]").dom.innerHTML=sessionsText;
        
        this.getEl().down("div[class=cpu]").dom.innerHTML=stats.oneMinuteLoadAvg;
        var oneMinuteLoadAvg = stats.oneMinuteLoadAvg;
        var oneMinuteLoadAvgAdjusted = oneMinuteLoadAvg - stats.numCpus;
        var loadText = '<font color="#55BA47">' + i18n._('low') + '</font>';
        if (oneMinuteLoadAvgAdjusted > 1.0) {
            loadText = '<font color="orange">' + i18n._('medium') + '</font>';
        }
        if (oneMinuteLoadAvgAdjusted > 4.0) {
            loadText = '<font color="red">' + i18n._('high') + '</font>';
        }
        this.getEl().down("div[class=cpu]").dom.innerHTML=loadText;

        var txSpeed=(stats.txBps<1000000) ? { value: Math.round(stats.txBps/10)/100, unit:"KB/s" }: {value: Math.round(stats.txBps/10000)/100, unit:"MB/s"};
        var rxSpeed=(stats.rxBps<1000000) ? { value: Math.round(stats.rxBps/10)/100, unit:"KB/s" }: {value: Math.round(stats.rxBps/10000)/100, unit:"MB/s"};
        this.getEl().down("div[class=tx-value]").dom.innerHTML=txSpeed.value+txSpeed.unit;
        this.getEl().down("div[class=rx-value]").dom.innerHTML=rxSpeed.value+rxSpeed.unit;
        var memoryFree=Ung.Util.bytesToMBs(stats.MemFree);
        var memoryUsed=Ung.Util.bytesToMBs(stats.MemTotal-stats.MemFree);
        this.getEl().down("div[class=free-value]").dom.innerHTML=memoryFree+" MB";
        this.getEl().down("div[class=used-value]").dom.innerHTML=memoryUsed+" MB";
        var diskPercent=Math.round((1-stats.freeDiskSpace/stats.totalDiskSpace)*20 )*5;
        this.getEl().down("div[name=disk_value]").dom.className="disk"+diskPercent;
        if(this.networkToolTip.rendered) {
            toolTipEl=this.networkToolTip.getEl();
            toolTipEl.down("span[name=tx_speed]").dom.innerHTML=txSpeed.value+" "+txSpeed.unit;
            toolTipEl.down("span[name=rx_speed]").dom.innerHTML=rxSpeed.value+" "+rxSpeed.unit;
        }
        if(this.sessionsToolTip.rendered) {
            toolTipEl=this.sessionsToolTip.getEl();
            toolTipEl.down("span[name=totalSessions]").dom.innerHTML=stats.uvmSessions ; 
            toolTipEl.down("span[name=uvmTCPSessions]").dom.innerHTML=stats.uvmTCPSessions;
            toolTipEl.down("span[name=uvmUDPSessions]").dom.innerHTML=stats.uvmUDPSessions;
        }
        if(this.cpuToolTip.rendered) {
            toolTipEl=this.cpuToolTip.getEl();
            toolTipEl.down("span[name=num_cpus]").dom.innerHTML=stats.numCpus;
            toolTipEl.down("span[name=cpu_model]").dom.innerHTML=stats.cpuModel;
            toolTipEl.down("span[name=cpu_speed]").dom.innerHTML=stats.cpuSpeed;
            var uptimeAux=Math.round(stats.uptime);
            var uptimeSeconds = uptimeAux%60;
            uptimeAux=parseInt(uptimeAux/60, 10);
            var uptimeMinutes = uptimeAux%60;
            uptimeAux=parseInt(uptimeAux/60, 10);
            var uptimeHours = uptimeAux%24;
            uptimeAux=parseInt(uptimeAux/24, 10);
            var uptimeDays = uptimeAux;

            toolTipEl.down("span[name=uptime]").dom.innerHTML=(uptimeDays>0?(uptimeDays+" "+(uptimeDays==1?i18n._("Day"):i18n._("Days"))+", "):"") + ((uptimeDays>0 || uptimeHours>0)?(uptimeHours+" "+(uptimeHours==1?i18n._("Hour"):i18n._("Hours"))+", "):"") + uptimeMinutes+" "+(uptimeMinutes==1?i18n._("Minute"):i18n._("Minutes"));
            toolTipEl.down("span[name=tasks]").dom.innerHTML=stats.numProcs;
            toolTipEl.down("span[name=load_average_1_min]").dom.innerHTML=stats.oneMinuteLoadAvg;
            toolTipEl.down("span[name=load_average_5_min]").dom.innerHTML=stats.fiveMinuteLoadAvg;
            toolTipEl.down("span[name=load_average_15_min]").dom.innerHTML=stats.fifteenMinuteLoadAvg;
        }
        if(this.memoryToolTip.rendered) {
            toolTipEl=this.memoryToolTip.getEl();
            toolTipEl.down("span[name=memory_used]").dom.innerHTML=memoryUsed;
            toolTipEl.down("span[name=memory_free]").dom.innerHTML=memoryFree;
            toolTipEl.down("span[name=memory_total]").dom.innerHTML=Ung.Util.bytesToMBs(stats.MemTotal);
            toolTipEl.down("span[name=memory_used_percent]").dom.innerHTML=Math.round((stats.MemTotal-stats.MemFree)/stats.MemTotal*100);
            toolTipEl.down("span[name=memory_free_percent]").dom.innerHTML=Math.round(stats.MemFree/stats.MemTotal*100);

            toolTipEl.down("span[name=swap_total]").dom.innerHTML=Ung.Util.bytesToMBs(stats.SwapTotal);
            toolTipEl.down("span[name=swap_used]").dom.innerHTML=Ung.Util.bytesToMBs(stats.SwapTotal-stats.SwapFree);
        }
        if(this.diskToolTip.rendered) {
            toolTipEl=this.diskToolTip.getEl();
            toolTipEl.down("span[name=total_disk_space]").dom.innerHTML=Math.round(stats.totalDiskSpace/10000000)/100;
            toolTipEl.down("span[name=free_disk_space]").dom.innerHTML=Math.round(stats.freeDiskSpace/10000000)/100;
            toolTipEl.down("span[name=disk_reads]").dom.innerHTML=Ung.Util.bytesToMBs(stats.diskReads);
            toolTipEl.down("span[name=disk_reads_per_second]").dom.innerHTML=Math.round(stats.diskReadsPerSecond*100)/100;
            toolTipEl.down("span[name=disk_writes]").dom.innerHTML=Ung.Util.bytesToMBs(stats.diskWrites);
            toolTipEl.down("span[name=disk_writes_per_second]").dom.innerHTML=Math.round(stats.diskWritesPerSecond*100)/100;
        }
    },
    reset: function() {
    }
});

// Faceplate Metric Class
Ext.define("Ung.FaceplateMetric", {
    extend: "Ext.Component",
    html: '<div class="chart"></div><div class="system"><div class="system-box"></div></div>',
    parentId: null,
    parentNodeId: null,
    data: null,
    byteCountCurrent: null,
    byteCountLast: null,
    sessionCountCurrent: null,
    sessionCountTotal: null,
    sessionRequestLast: null,
    sessionRequestTotal: null,
    hasChart: false,
    chart: null,
    chartData: null,
    chartDataLength: 20,
    chartTip: null,
    afterRender: function() {
        this.callParent(arguments);
        var out = [];
        for (var i = 0; i < 4; i++) {
            var top = 1 + i * 15;
            out.push('<div class="system-label" style="top:' + top + 'px;" id="systemName_' + this.getId() + '_' + i + '"></div>');
            out.push('<div class="system-value" style="top:' + top + 'px;" id="systemValue_' + this.getId() + '_' + i + '"></div>');
        }
        var systemBoxEl=this.getEl().down("div[class=system-box]");
        systemBoxEl.insertHtml("afterBegin", out.join(""));
        this.buildActiveMetrics();
        systemBoxEl.on("click", this.showMetricSettings , this);
        this.buildChart();
    },
    beforeDestroy: function() {
        if(this.chartTip != null) {
            Ext.destroy(this.chartTip);
        }
        if(this.chart != null ) {
            Ext.destroy(this.chart);
        }
        this.callParent(arguments);
    },
    buildChart: function() {
        var i;
        for(i=0; i<this.metrics.list.length; i++) {
            if(this.metrics.list[i].name=="live-sessions") {
                this.hasChart = true;
                break;
            }
        }
        //Do not show chart graph for these apps even though they have the live-sessions metrics
        if(this.nodeName === "untangle-node-firewall" ||
           this.nodeName === "untangle-node-openvpn" ||
           this.nodeName === "untangle-node-splitd") {
            this.hasChart = false;
        }
        var chartContainerEl = this.getEl().down("div[class=chart]");
        //Do not build chart graph if the node doesn't have live-session metrics
        if( !this.hasChart ) {
            chartContainerEl.hide();
            return;
        }

        this.chartData = [];
        for(i=0; i<this.chartDataLength; i++) {
            this.chartData.push({time:i, sessions:0});
        }
        this.chart = Ext.create('Ext.chart.Chart', {
            renderTo: chartContainerEl,
            width: chartContainerEl.getWidth(),
            height: chartContainerEl.getHeight(),
            animate: false,
            theme: 'Green',
            //insetPadding: 11,
            store: Ext.create('Ext.data.JsonStore', {
                fields: ['time', 'sessions'],
                data: this.chartData
            }),
            axes: [{
                type: 'Numeric',
                position: 'left',
                fields: ['sessions'],
                minimum: 0,
                majorTickSteps: 0,
                minorTickSteps: 3
            }],
            series: [{
                type: 'line',
                axis: 'left',
                smooth: true,
                showMarkers: false,
                fill:true,
                xField: 'time',
                yField: 'sessions'
            }]
        });
        this.chart.on("click", function(e) { main.showNodeSessions( this.parentNodeId ); }, this);
        var chartTipArr=[
           '<div class="title">'+i18n._("Session History. Current Sessions:")+' <span name="current_sessions">0</span></div>'
        ];
        this.chartTip=Ext.create('Ext.tip.ToolTip',{
            target: chartContainerEl,
            dismissDelay: 0,
            hideDelay: 400,
            width: 330,
            cls: 'extended-stats',
            renderTo: Ext.getBody(),
            html: chartTipArr.join('')
        });
        
    },
    buildActiveMetrics: function () {
        var nodeCmp = Ext.getCmp(this.parentId);
        var activeMetrics = nodeCmp.activeMetrics;
        if(activeMetrics.length>4) {
            Ext.MessageBox.alert(i18n._("Warning"), Ext.String.format(i18n._("The node {0} has {1} metrics. The maximum number of metrics is {2}."),nodeCmp.displayName ,activeMetrics.length,4));
        }
        var metricsLen=Math.min(activeMetrics.length,4);
        var i, nameDiv, valueDiv;
        /* set all four to blank */
        for(i=0; i<4;i++) {
            nameDiv=document.getElementById('systemName_' + this.getId() + '_' + i);
            valueDiv=document.getElementById('systemValue_' + this.getId() + '_' + i);
            nameDiv.innerHTML = "&nbsp;";
            nameDiv.style.display="none";
            valueDiv.innerHTML = "&nbsp;";
            valueDiv.style.display="none";
        }
        /* fill in name and value */
        for(i=0; i<metricsLen;i++) {
            var metricIndex=activeMetrics[i];
            var metric = nodeCmp.metrics.list[metricIndex];
            if (metric != null && metric !== undefined) {
                nameDiv=document.getElementById('systemName_' + this.getId() + '_' + i);
                valueDiv=document.getElementById('systemValue_' + this.getId() + '_' + i);
                nameDiv.innerHTML = i18n._(metric.displayName);
                nameDiv.style.display="";
                valueDiv.innerHTML = "&nbsp;";
                valueDiv.style.display="";
            }
        }
    },
    showMetricSettings: function() {
        var nodeCmp = Ext.getCmp(this.parentId);
        this.newActiveMetrics=[];
        var i;
        if(this.configWin==null) {
            var configItems=[];
            for(i=0;i<nodeCmp.metrics.list.length;i++) {
                var metric = nodeCmp.metrics.list[i];
                configItems.push({
                    xtype: 'checkbox',
                    boxLabel: i18n._(metric.displayName),
                    hideLabel: true,
                    name: metric.displayName,
                    dataIndex: i,
                    checked: false,
                    listeners: {
                        "change": {
                            fn: Ext.bind(function(elem, checked) {
                                if(checked && this.newActiveMetrics.length>=4) {
                                    Ext.MessageBox.alert(i18n._("Warning"),i18n._("Please set up to four items."));
                                    elem.setValue(false);
                                    return;
                                }
                                var itemIndex=-1;
                                for(var i=0;i<this.newActiveMetrics.length;i++) {
                                    if(this.newActiveMetrics[i]==elem.dataIndex) {
                                        itemIndex=i;
                                        break;
                                    }
                                }
                                if(checked) {
                                    if(itemIndex==-1) {
                                        // add element
                                        this.newActiveMetrics.push(elem.dataIndex);
                                    }
                                } else {
                                    if(itemIndex!=-1) {
                                        // remove element
                                        this.newActiveMetrics.splice(itemIndex,1);
                                    }
                                }
                            }, this)
                        }
                    }
                });
            }
            this.configWin= Ext.create("Ung.Window", {
                metricsCmp: this,
                modal: true,
                title: i18n._("Set up to four"),
                bodyStyle: "padding: 5px 5px 5px 15px;",
                defaults: {},
                items: configItems,
                autoScroll: true,
                draggable: true,
                resizable: true,
                buttons: [{
                    name: 'Ok',
                    text: i18n._("Ok"),
                    handler: Ext.bind(function() {
                        this.updateActiveMetrics();
                        this.configWin.hide();
                    }, this)
                },{
                    name: 'Cancel',
                    text: i18n._("Cancel"),
                    handler: Ext.bind(function() {
                        this.configWin.hide();
                    }, this)
                }],
                onShow: function() {
                    Ung.Window.superclass.onShow.call(this);
                    this.setSize({width:260,height:280});
                    this.alignTo(this.metricsCmp.getEl(),"tr-br");
                    var pos=this.getPosition();
                    var sub=pos[1]+280-main.viewport.getSize().height;
                    if(sub>0) {
                        this.setPosition( pos[0],pos[1]-sub);
                    }
                }
            });
        }

        for(i=0;i<this.configWin.items.length;i++) {
            this.configWin.items.get(i).setValue(false);
        }
        for(i=0 ; i<nodeCmp.activeMetrics.length ; i++ ) {
            var metricIndex = nodeCmp.activeMetrics[i];
            var metricItem=this.configWin.items.get(metricIndex);
            if (metricItem != null)
                metricItem.setValue(true);
        }
        this.configWin.show();
    },
    updateActiveMetrics: function() {
        var nodeCmp = Ext.getCmp(this.parentId);
        nodeCmp.activeMetrics = this.newActiveMetrics;
        this.buildActiveMetrics();
    },
    update: function(metrics) {
        // UPDATE COUNTS
        var nodeCmp = Ext.getCmp(this.parentId);
        var activeMetrics = nodeCmp.activeMetrics;
        var i;
        for (i = 0; i < activeMetrics.length; i++) {
            var metricIndex = activeMetrics[i];
            var metric = nodeCmp.metrics.list[metricIndex];
            if (metric != null && metric !== undefined) {
                var newValue="&nbsp;";
                newValue = metric.value;
                var valueDiv = document.getElementById('systemValue_' + this.getId() + '_' + i);
                if(valueDiv!=null) {
                    valueDiv.innerHTML = newValue;
                }
            }
        }
        if( this.hasChart && this.chartData != null ) {
            var reloadChart = this.chartData[0].sessions != 0;
            for(i=0;i<this.chartData.length-1;i++) {
                this.chartData[i].sessions=this.chartData[i+1].sessions;
                reloadChart = (reloadChart || (this.chartData[i].sessions != 0));
            }
            var currentSessions = this.getCurrentSessions(nodeCmp.metrics);
            reloadChart = (reloadChart || (currentSessions!=0));
            this.chartData[this.chartData.length-1].sessions=currentSessions;
            if(reloadChart) {
                this.chart.store.loadData(this.chartData);
                if(this.chartTip.rendered) {
                    this.chartTip.getEl().down("span[name=current_sessions]").dom.innerHTML=currentSessions;
                }
            }
        }
    },
    getCurrentSessions: function(metrics) {
        if(this.currentSessionsMetricIndex == null) {
            this.currentSessionsMetricIndex = -1;
            for(var i=0;i<metrics.list.length; i++) {
                if(metrics.list[i].name=="live-sessions") {
                    this.currentSessionsMetricIndex = i;
                    break;
                }
            }
        }
        if(testMode) {
            if(!this.maxRandomNumber) {
                this.maxRandomNumber=Math.floor((Math.random()*200));
            }
            //Just for test generate random data
            return this.currentSessionsMetricIndex>=0?Math.floor((Math.random()*this.maxRandomNumber)):0;
        }
        return this.currentSessionsMetricIndex>=0?metrics.list[this.currentSessionsMetricIndex].value:0;
    },
    reset: function() {
        if (this.chartData != null) {
            var i;
            for(i = 0; i<this.chartData.length; i++) {
                this.chartData[i].sessions=0;
            }
            this.chart.store.loadData(this.chartData);
            for (i = 0; i < 4; i++) {
                var valueDiv = document.getElementById('systemValue_' + this.getId() + '_' + i);
                valueDiv.innerHTML = "&nbsp;";
            }
        }
    }
});
Ext.ComponentMgr.registerType('ungFaceplateMetric', Ung.FaceplateMetric);



// Event Log class
Ext.define("Ung.GridEventLog", {
    extend: "Ext.grid.Panel",
    // the settings component
    settingsCmp: null,
    reserveScrollbar: true,
    // refresh on activate Tab (each time the tab is clicked)
    refreshOnActivate: true,
    // Event manager rpc function to call
    // default is getEventQueries() from settingsCmp
    eventQueriesFn: null,
    // Records per page
    recordsPerPage: 25,
    // fields for the Store
    fields: null,
    // columns for the column model
    columns: null,
    enableColumnHide: false,
    enableColumnMove: false,
    // for internal use
    rpc: null,
    helpSource: 'event_log',
    enableColumnMenu: false,
    // mask to show during refresh
    // loadMask: {msg: i18n._("Refreshing...")},
    // called when the component is initialized
    constructor: function(config) {
         var modelName='Ung.GridEventLog.Store.ImplicitModel-' + Ext.id();
         Ext.define(modelName, {
             extend: 'Ext.data.Model',
             fields: config.fields
         });
         config.modelName = modelName;

        this.callParent(arguments);
    },
    initComponent: function() {
        this.rpc = {};
        
        if( this.viewConfig == null ) {
            this.viewConfig = {};
        }
        this.viewConfig.enableTextSelection = true;
        
        if ( this.title == null ) {
            this.title = i18n._('Event Log');
        }
        if ( this.name == null ) {
            this.name = 'EventLog';
        }
        if ( this.hasAutoRefresh == null ) {
            this.hasAutoRefresh = true;
        }
        if ( this.name == null ) {
            this.name = "Event Log";
        }
        if ( this.eventQueriesFn == null ) {
            this.eventQueriesFn = this.settingsCmp.node.rpcNode.getEventQueries;
        }
        this.rpc.repository = {};
        this.store=Ext.create('Ext.data.Store', {
            model: this.modelName,
            data: [],
            pageSize: this.recordsPerPage,
            proxy: {
                type: 'pagingmemory',
                reader: {
                    type: 'json',
                    root: 'list'
                }
            },
            autoLoad: false,
            remoteSort:true,
            remoteFilter: true
        });
        
        this.pagingToolbar = Ext.create('Ext.toolbar.Paging',{
            width: 250,
            store: this.store,
            style: "border:0; top:1px;"
        });

        this.bbar = [{
            xtype: 'tbtext',
            id: "querySelector_"+this.getId(),
            text: ''
        }, {
            xtype: 'tbtext',
            id: "rackSelector_"+this.getId(),
            text: ''
        }, {
            xtype: 'button',
            id: "refresh_"+this.getId(),
            text: i18n._('Refresh'),
            name: "Refresh",
            tooltip: i18n._('Flush Events from Memory to Database and then Refresh'),
            iconCls: 'icon-refresh',
            handler: Ext.bind(this.flushHandler, this, [true])
        }, {
            xtype: 'button',
            hidden: !this.hasAutoRefresh,
            id: "auto_refresh_"+this.getId(),
            text: i18n._('Auto Refresh'),
            enableToggle: true,
            pressed: false,
            name: "Auto Refresh",
            tooltip: i18n._('Auto Refresh every 5 seconds'),
            iconCls: 'icon-autorefresh',
            handler: Ext.bind(function() {
                var autoRefreshButton=Ext.getCmp("auto_refresh_"+this.getId());
                if(autoRefreshButton.pressed) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            }, this)
        }, {
            xtype: 'button',
            id: "export_"+this.getId(),
            text: i18n._('Export'),
            name: "Export",
            tooltip: i18n._('Export Events to File'),
            iconCls: 'icon-export',
            handler: Ext.bind(this.exportHandler, this)
        }, {
            xtype: 'tbtext',
            text: '<div style="width:30px;"></div>'
        }, this.pagingToolbar];
        this.callParent(arguments);

        if (!this.enableColumnMenu){
            var cmConfig = this.columns;
            for (var i in cmConfig) {
                var col=cmConfig[i];
                if (col.sortable == true || col.sortable == null) {
                    col.menuDisabled= true;
                    col.sortable = true;
                    col.initialSortable = true;
                } else {
                    col.initialSortable = false;
                }
            }
        }
    },
    autoRefreshEnabled:true,
    startAutoRefresh: function(setButton) {
        this.pagingToolbar.hide();
        this.autoRefreshEnabled=true;
        var columnModel=this.columns;
        this.getStore().sort(columnModel[0].dataIndex, "DESC");
        for (var i in columnModel) {
            columnModel[i].sortable = false;
        }
        if(setButton) {
            var autoRefreshButton=Ext.getCmp("auto_refresh_"+this.getId());
            autoRefreshButton.toggle(true);
        }
        var refreshButton=Ext.getCmp("refresh_"+this.getId());
        refreshButton.disable();
        this.autoRefreshList();
    },
    stopAutoRefresh: function(setButton) {
        this.autoRefreshEnabled=false;
        this.pagingToolbar.show();
        var columnModel=this.columns;
        for (var i in columnModel) {
            columnModel[i].sortable = columnModel[i].initialSortable;
        }
        if(setButton) {
            var autoRefreshButton=Ext.getCmp("auto_refresh_"+this.getId());
            autoRefreshButton.toggle(false);
        }
        var refreshButton=Ext.getCmp("refresh_"+this.getId());
        refreshButton.enable();
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
        
        if (this.settingsCmp !== null) {
            this.getStore().getProxy().data = events;
            this.getStore().load({
                params: {
                    start: 0,
                    limit: this.recordsPerPage
                }
            });
        }
        if(this!=null && this.rendered && this.autoRefreshEnabled) {
            if(this==this.settingsCmp.tabs.getActiveTab()) {
                Ext.Function.defer(this.autoRefreshList, 5000, this);
            } else {
                this.stopAutoRefresh(true);
            }
        }
    },
    autoRefreshList: function() {
        this.getUntangleNodeReporting().flushEvents(Ext.bind(function(result, exception) {
            var selQuery = this.getSelectedQuery();
            var selPolicy = this.getSelectedPolicy();
            if (selQuery != null && selPolicy != null) {
                rpc.jsonrpc.UvmContext.getEvents(Ext.bind(this.autoRefreshCallback, this), selQuery, selPolicy, 50 );
            }
        }, this));
    },
    exportHandler: function() {
        var selQuery = this.getSelectedQuery();
        var selQueryName = this.getSelectedQueryName();
        var selPolicy = this.getSelectedPolicy();
        if (selQuery != null && selPolicy != null) {
            Ext.MessageBox.wait(i18n._("Exporting Events..."), i18n._("Please wait"));
            var name = ( (this.name!=null) ? this.name: i18n._("Event Log") ) + " " +selQueryName;
            name=name.trim().replace(/ /g,"_");
            var downloadForm = document.getElementById('downloadForm');
            downloadForm["type"].value="eventLogExport";
            downloadForm["arg1"].value=name;
            downloadForm["arg2"].value=selQuery;
            downloadForm["arg3"].value=selPolicy;
            downloadForm["arg4"].value=this.getColumnList();
            downloadForm.submit();
            Ext.MessageBox.hide();
        }
    },
    // called when the component is rendered
    afterRender: function() {
        this.callParent(arguments);
        //TODO: extjs4 migration find an alternative
        //this.getGridEl().down("div[class*=x-grid3-viewport]").set({'name': "Table"});
        //this.pagingToolbar.loading.hide();
        
        if (this.eventQueriesFn != null) {
            this.rpc.eventLogQueries=this.eventQueriesFn();
            var queryList = this.rpc.eventLogQueries;
            var displayStyle;
            var out =[];
            var i;
            var selOpt;
            out.push('<select name="Event Type" id="selectQuery_' + this.getId() + '">');
            for (i = 0; i < queryList.length; i++) {
                var queryDesc = queryList[i];
                selOpt = (i === 0) ? "selected": "";
                out.push('<option value="' + queryDesc.query + '" ' + selOpt + '>' + i18n._(queryDesc.name) + '</option>');
            }
            out.push('</select>');
            Ext.getCmp('querySelector_' + this.getId()).setText(out.join(""));

            displayStyle="";
            if (this.settingsCmp.node != null &&
                this.settingsCmp.node.nodeProperties != null && 
                this.settingsCmp.node.nodeProperties.type == "SERVICE") {
                displayStyle = "display:none;"; //hide rack selector for services
            }
            out = [];
            out.push('<select name="Rack" id="selectPolicy_' + this.getId() + '" style="'+displayStyle+'">');
            out.push('<option value="-1">' + i18n._('All Racks') + '</option>');
            for (i = 0; i < rpc.policies.length; i++) {
                var policy = rpc.policies[i];
                selOpt = ( policy == rpc.currentPolicy ) ? "selected": "";
                out.push('<option value="' + policy.policyId + '" ' + selOpt + '>' + policy.name + '</option>');
            }
            out.push('</select>');
            Ext.getCmp('rackSelector_' + this.getId()).setText(out.join(""));
        }
    },
    // get selected query value
    getSelectedQuery: function() {
        var selObj = document.getElementById('selectQuery_' + this.getId());
        var result = null;
        if (selObj !== null && selObj.selectedIndex >= 0) {
            result = selObj.options[selObj.selectedIndex].value;
        }
        return result;
    },
    // get selected query name
    getSelectedQueryName: function() {
        var selObj = document.getElementById('selectQuery_' + this.getId());
        var result = "";
        if (selObj !== null && selObj.selectedIndex >= 0) {
            result = selObj.options[selObj.selectedIndex].label;
        }
        return result;
    },
    // get selected policy
    getSelectedPolicy: function() {
        var selObj = document.getElementById('selectPolicy_' + this.getId());
        var result = "";
        if (selObj !== null && selObj.selectedIndex >= 0) {
            result = selObj.options[selObj.selectedIndex].value;
        }
        return result;
    },
    // return the list of columns in the event long as a comma separated list
    getColumnList: function() {
        var columnList = "";
        for (var i=0; i<this.fields.length ; i++) {
            if (i !== 0)
                columnList += ",";
            if (this.fields[i].mapping != null)
                columnList += this.fields[i].mapping;
            else if (this.fields[i].name != null)
                columnList += this.fields[i].name;
        }
        return columnList;
    },
    refreshHandler: function (forceFlush) {
        if (!this.isReportsAppInstalled()) {
            Ext.MessageBox.alert(i18n._('Warning'), i18n._("Event Logs require the Reports application. Please install and enable the Reports application."));
        } else {
            if (!forceFlush) {
                this.setLoading(i18n._('Refreshing Events...'));
                this.refreshList();
            } else {
                this.setLoading(i18n._('Syncing events to Database... '));
                this.getUntangleNodeReporting().flushEvents(Ext.bind(function(result, exception) {
                    this.setLoading(i18n._('Refreshing Events...'));
                    this.refreshList();
                }, this));
            }
        }
    },
    //Used to get dummy records in testing
    getTestRecord:function(index, fields) {
        var rec= {};
        var property;
        for (var i=0; i<fields.length ; i++) {
            property = (fields[i].mapping != null)?fields[i].mapping:fields[i].name;
            rec[property]=
                (property=='id')?index+1:
                (property=='time_stamp')?{javaClass:"java.util.Date", time: (new Date(i*10000)).getTime()}:
                    property+"_"+(i*index)+"_"+Math.floor((Math.random()*10));
        }
        return rec;
    },
    // Refresh the events list
    refreshCallback: function(result, exception) {
        if (exception != null) {
           Ung.Util.handleException(exception);
        } else {
            var events = result;
            //TEST:Add sample events for test
            if(testMode) {
                var emptyRec={};
                var length = Math.floor((Math.random()*150));
                for(var i=0; i<length; i++) {
                    events.list.push(this.getTestRecord(i, this.fields));
                }
            }
            if (this.settingsCmp !== null) {
                this.getStore().getProxy().data = events;
                this.getStore().loadPage(1, {
                    limit:this.recordsPerPage ? this.recordsPerPage: Ung.Util.maxRowCount
                });
            }
        }
        this.setLoading(false);
    },
    flushHandler: function (forceFlush) {
        if (!this.isReportsAppInstalled()) {
            Ext.MessageBox.alert(i18n._('Warning'), i18n._("Event Logs require the Reports application. Please install and enable the Reports application."));
        } else {
            this.setLoading(i18n._('Syncing events to Database... '));
            this.getUntangleNodeReporting().flushEvents(Ext.bind(function(result, exception) {
                // refresh after complete
                this.refreshHandler();
            }, this));
        }
    },
    refreshList: function() {
        var selQuery = this.getSelectedQuery();
        var selPolicy = this.getSelectedPolicy();
        if (selQuery != null && selPolicy != null) {
            rpc.jsonrpc.UvmContext.getEvents(Ext.bind(this.refreshCallback, this), selQuery, selPolicy, 1000);
        } else {
            this.setLoading(false);
        }
    },
    // is reports node installed
    isReportsAppInstalled: function(forceReload) {
        if (forceReload || this.reportsAppInstalledAndEnabled === undefined) {
            try {
                var reportsNode = this.getUntangleNodeReporting();
                if (this.untangleNodeReporting == null) {
                    this.reportsAppInstalledAndEnabled = false;
                }
                else {
                    if (reportsNode.getRunState() == "RUNNING") 
                        this.reportsAppInstalledAndEnabled = true;
                    else
                        this.reportsAppInstalledAndEnabled = false;
                }
            } catch (e) {
                Ung.Util.rpcExHandler(e);
            }
        }
        return this.reportsAppInstalledAndEnabled;
    },
    // get untangle node reporting
    getUntangleNodeReporting: function(forceReload) {
        if (forceReload || this.untangleNodeReporting === undefined) {
            try {
                this.untangleNodeReporting = rpc.nodeManager.node("untangle-node-reporting");
            } catch (e) {
                Ung.Util.rpcExHandler(e);
            }
        }
        return this.untangleNodeReporting;
    },
    
    listeners: {
        "activate": {
            fn: function() {
                if( this.refreshOnActivate ) {
                    Ext.Function.defer(this.refreshHandler,1, this, [false]);
                }
            }
        },
        "deactivate": {
            fn: function() {
                if(this.autoRefreshEnabled) {
                    this.stopAutoRefresh(true);
                }
            }
        }
    },
    isDirty: function() {
        return false;
    }
});


//Event Log class
Ext.define("Ung.GridEventLogBuffered", {
    extend: "Ext.grid.Panel",
    // the settings component
    settingsCmp: null,
    reserveScrollbar: true,
    // refresh on activate Tab (each time the tab is clicked)
    refreshOnActivate: true,
    // Event manager rpc function to call
    // default is getEventQueries() from settingsCmp
    eventQueriesFn: null,
    // Records per page
    recordsPerPage: 50000,
    // fields for the Store
    fields: null,
    // columns for the column model
    columns: null,
    enableColumnHide: false,
    enableColumnMove: false,
    // for internal use
    rpc: null,
    helpSource: 'event_log',
    enableColumnMenu: false,
    verticalScrollerType: 'paginggridscroller',
    plugins: {
        ptype: 'bufferedrenderer',
        trailingBufferZone: 20,  // Keep 20 rows rendered in the table behind scroll
        leadingBufferZone: 50   // Keep 50 rows rendered in the table ahead of scroll
    },
    paginated: false,
    invalidateScrollerOnRefresh: false,
    loadMask: true,
    
    // called when the component is initialized
    constructor: function(config) {
         var modelName='Ung.GridEventLog.Store.ImplicitModel-' + Ext.id();
         Ext.define(modelName, {
             extend: 'Ext.data.Model',
             fields: config.fields
         });
         config.modelName = modelName;

        this.callParent(arguments);
    },
    initComponent: function() {
        this.rpc = {};
        
        if( this.viewConfig == null ) {
            this.viewConfig = {};
        }
        this.viewConfig.enableTextSelection = true;
        
        if ( this.title == null ) {
            this.title = i18n._('Event Log');
        }
        if ( this.name == null ) {
            this.name = 'EventLog';
        }
        if ( this.hasAutoRefresh == null ) {
            this.hasAutoRefresh = true;
        }
        if ( this.name == null ) {
            this.name = "Event Log";
        }
        if ( this.eventQueriesFn == null ) {
            this.eventQueriesFn = this.settingsCmp.node.rpcNode.getEventQueries;
        }
        this.rpc.repository = {};
        this.store=Ext.create('Ext.data.Store', {
            model: this.modelName,
            data: [],
            pageSize: 100,
            buffered: true,
            proxy: {
                type: 'pagingmemory',
                reader: {
                    type: 'json',
                    root: 'list'
                }
            },
            autoLoad: false,
            remoteSort:true,
            remoteFilter: true
        });

        this.bbar = [{
            xtype: 'tbtext',
            id: "querySelector_"+this.getId(),
            text: ''
        }, {
            xtype: 'tbtext',
            id: "rackSelector_"+this.getId(),
            text: ''
        }, {
            xtype: 'button',
            id: "refresh_"+this.getId(),
            text: i18n._('Refresh'),
            name: "Refresh",
            tooltip: i18n._('Flush Events from Memory to Database and then Refresh'),
            iconCls: 'icon-refresh',
            handler: Ext.bind(this.flushHandler, this, [true])
        }, {
            xtype: 'button',
            hidden: !this.hasAutoRefresh,
            id: "auto_refresh_"+this.getId(),
            text: i18n._('Auto Refresh'),
            enableToggle: true,
            pressed: false,
            name: "Auto Refresh",
            tooltip: i18n._('Auto Refresh every 5 seconds'),
            iconCls: 'icon-autorefresh',
            handler: Ext.bind(function() {
                var autoRefreshButton=Ext.getCmp("auto_refresh_"+this.getId());
                if(autoRefreshButton.pressed) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            }, this)
        }, {
            xtype: 'button',
            id: "export_"+this.getId(),
            text: i18n._('Export'),
            name: "Export",
            tooltip: i18n._('Export Events to File'),
            iconCls: 'icon-export',
            handler: Ext.bind(this.exportHandler, this)
        }, {
            xtype: 'tbtext',
            text: '<div style="width:30px;"></div>'
        }];
        this.callParent(arguments);

        if (!this.enableColumnMenu){
            var cmConfig = this.columns;
            for (var i in cmConfig) {
                var col=cmConfig[i];
                if (col.sortable == true || col.sortable == null) {
                    col.menuDisabled= true;
                    col.sortable = true;
                    col.initialSortable = true;
                } else {
                    col.initialSortable = false;
                }
            }
        }
    },
    autoRefreshEnabled:true,
    startAutoRefresh: function(setButton) {
        this.autoRefreshEnabled=true;
        var columnModel=this.columns;
        this.getStore().sort(columnModel[0].dataIndex, "DESC");
        for (var i in columnModel) {
            columnModel[i].sortable = false;
        }
        if(setButton) {
            var autoRefreshButton=Ext.getCmp("auto_refresh_"+this.getId());
            autoRefreshButton.toggle(true);
        }
        var refreshButton=Ext.getCmp("refresh_"+this.getId());
        refreshButton.disable();
        this.autoRefreshList();
    },
    stopAutoRefresh: function(setButton) {
        this.autoRefreshEnabled=false;
        var columnModel=this.columns;
        for (var i in columnModel) {
            columnModel[i].sortable = columnModel[i].initialSortable;
        }
        if(setButton) {
            var autoRefreshButton=Ext.getCmp("auto_refresh_"+this.getId());
            autoRefreshButton.toggle(false);
        }
        var refreshButton=Ext.getCmp("refresh_"+this.getId());
        refreshButton.enable();
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
        
        if (this.settingsCmp !== null) {
            this.getStore().getProxy().data = events;
            this.getStore().load({
                params: {
                    start: 0,
                    limit: this.recordsPerPage
                }
            });
        }
        if(this!=null && this.rendered && this.autoRefreshEnabled) {
            if(this==this.settingsCmp.tabs.getActiveTab()) {
                Ext.Function.defer(this.autoRefreshList, 5000, this);
            } else {
                this.stopAutoRefresh(true);
            }
        }
    },
    autoRefreshList: function() {
        this.getUntangleNodeReporting().flushEvents(Ext.bind(function(result, exception) {
            var selQuery = this.getSelectedQuery();
            var selPolicy = this.getSelectedPolicy();
            if (selQuery != null && selPolicy != null) {
                rpc.jsonrpc.UvmContext.getEvents(Ext.bind(this.autoRefreshCallback, this), selQuery, selPolicy, 50 );
            }
        }, this));
    },
    exportHandler: function() {
        var selQuery = this.getSelectedQuery();
        var selQueryName = this.getSelectedQueryName();
        var selPolicy = this.getSelectedPolicy();
        if (selQuery != null && selPolicy != null) {
            Ext.MessageBox.wait(i18n._("Exporting Events..."), i18n._("Please wait"));
            var name = ( (this.name!=null) ? this.name: i18n._("Event Log") ) + " " +selQueryName;
            name=name.trim().replace(/ /g,"_");
            var downloadForm = document.getElementById('downloadForm');
            downloadForm["type"].value="eventLogExport";
            downloadForm["arg1"].value=name;
            downloadForm["arg2"].value=selQuery;
            downloadForm["arg3"].value=selPolicy;
            downloadForm["arg4"].value=this.getColumnList();
            downloadForm.submit();
            Ext.MessageBox.hide();
        }
    },
    // called when the component is rendered
    afterRender: function() {
        this.callParent(arguments);
        //TODO: extjs4 migration find an alternative
        //this.getGridEl().down("div[class*=x-grid3-viewport]").set({'name': "Table"});
        
        if (this.eventQueriesFn != null) {
            this.rpc.eventLogQueries=this.eventQueriesFn();
            var queryList = this.rpc.eventLogQueries;
            var displayStyle;
            var out =[];
            var i;
            var selOpt;
            out.push('<select name="Event Type" id="selectQuery_' + this.getId() + '">');
            for (i = 0; i < queryList.length; i++) {
                var queryDesc = queryList[i];
                selOpt = (i === 0) ? "selected": "";
                out.push('<option value="' + queryDesc.query + '" ' + selOpt + '>' + i18n._(queryDesc.name) + '</option>');
            }
            out.push('</select>');
            Ext.getCmp('querySelector_' + this.getId()).setText(out.join(""));

            displayStyle="";
            if (this.settingsCmp.node != null &&
                this.settingsCmp.node.nodeProperties != null && 
                this.settingsCmp.node.nodeProperties.type == "SERVICE") {
                displayStyle = "display:none;"; //hide rack selector for services
            }
            out = [];
            out.push('<select name="Rack" id="selectPolicy_' + this.getId() + '" style="'+displayStyle+'">');
            out.push('<option value="-1">' + i18n._('All Racks') + '</option>');
            for (i = 0; i < rpc.policies.length; i++) {
                var policy = rpc.policies[i];
                selOpt = ( policy == rpc.currentPolicy ) ? "selected": "";
                out.push('<option value="' + policy.policyId + '" ' + selOpt + '>' + policy.name + '</option>');
            }
            out.push('</select>');
            Ext.getCmp('rackSelector_' + this.getId()).setText(out.join(""));
        }
    },
    // get selected query value
    getSelectedQuery: function() {
        var selObj = document.getElementById('selectQuery_' + this.getId());
        var result = null;
        if (selObj !== null && selObj.selectedIndex >= 0) {
            result = selObj.options[selObj.selectedIndex].value;
        }
        return result;
    },
    // get selected query name
    getSelectedQueryName: function() {
        var selObj = document.getElementById('selectQuery_' + this.getId());
        var result = "";
        if (selObj !== null && selObj.selectedIndex >= 0) {
            result = selObj.options[selObj.selectedIndex].label;
        }
        return result;
    },
    // get selected policy
    getSelectedPolicy: function() {
        var selObj = document.getElementById('selectPolicy_' + this.getId());
        var result = "";
        if (selObj !== null && selObj.selectedIndex >= 0) {
            result = selObj.options[selObj.selectedIndex].value;
        }
        return result;
    },
    // return the list of columns in the event long as a comma separated list
    getColumnList: function() {
        var columnList = "";
        for (var i=0; i<this.fields.length ; i++) {
            if (i !== 0)
                columnList += ",";
            if (this.fields[i].mapping != null)
                columnList += this.fields[i].mapping;
            else if (this.fields[i].name != null)
                columnList += this.fields[i].name;
        }
        return columnList;
    },
    refreshHandler: function (forceFlush) {
        if (!this.isReportsAppInstalled()) {
            Ext.MessageBox.alert(i18n._('Warning'), i18n._("Event Logs require the Reports application. Please install and enable the Reports application."));
        } else {
            if (!forceFlush) {
                this.setLoading(i18n._('Refreshing Events...'));
                this.refreshList();
            } else {
                this.setLoading(i18n._('Syncing events to Database... '));
                this.getUntangleNodeReporting().flushEvents(Ext.bind(function(result, exception) {
                    this.setLoading(i18n._('Refreshing Events...'));
                    this.refreshList();
                }, this));
            }
        }
    },
    //Used to get dummy records in testing
    getTestRecord:function(index, fields) {
        var rec= {};
        var property;
        for (var i=0; i<fields.length ; i++) {
            property = (fields[i].mapping != null)?fields[i].mapping:fields[i].name;
            rec[property]=
                (property=='id')?index+1:
                (property=='time_stamp')?{javaClass:"java.util.Date", time: (new Date(i*10000)).getTime()}:
                    property+"_"+(i*index)+"_"+Math.floor((Math.random()*10));
        }
        return rec;
    },
    // Refresh the events list
    refreshCallback: function(result, exception) {
        if (exception != null) {
           Ung.Util.handleException(exception);
        } else {
            var events = result;
            //TEST:Add sample events for test
            if(testMode) {
                var emptyRec={};
                var length = Math.floor((Math.random()*150));
                for(var i=0; i<length; i++) {
                    events.list.push(this.getTestRecord(i, this.fields));
                }
            }
            if (this.settingsCmp !== null) {
                this.getStore().getProxy().data = events;
                this.getStore().loadPage(1, {
                    limit:this.recordsPerPage ? this.recordsPerPage: Ung.Util.maxRowCount
                });
            }
        }
        this.setLoading(false);
    },
    flushHandler: function (forceFlush) {
        if (!this.isReportsAppInstalled()) {
            Ext.MessageBox.alert(i18n._('Warning'), i18n._("Event Logs require the Reports application. Please install and enable the Reports application."));
        } else {
            this.setLoading(i18n._('Syncing events to Database... '));
            this.getUntangleNodeReporting().flushEvents(Ext.bind(function(result, exception) {
                // refresh after complete
                this.refreshHandler();
            }, this));
        }
    },
    refreshList: function() {
        var selQuery = this.getSelectedQuery();
        var selPolicy = this.getSelectedPolicy();
        if (selQuery != null && selPolicy != null) {
            rpc.jsonrpc.UvmContext.getEvents(Ext.bind(this.refreshCallback, this), selQuery, selPolicy, 50000);
        } else {
            this.setLoading(false);
        }
    },
    // is reports node installed
    isReportsAppInstalled: function(forceReload) {
        if (forceReload || this.reportsAppInstalledAndEnabled === undefined) {
            try {
                var reportsNode = this.getUntangleNodeReporting();
                if (this.untangleNodeReporting == null) {
                    this.reportsAppInstalledAndEnabled = false;
                }
                else {
                    if (reportsNode.getRunState() == "RUNNING") 
                        this.reportsAppInstalledAndEnabled = true;
                    else
                        this.reportsAppInstalledAndEnabled = false;
                }
            } catch (e) {
                Ung.Util.rpcExHandler(e);
            }
        }
        return this.reportsAppInstalledAndEnabled;
    },
    // get untangle node reporting
    getUntangleNodeReporting: function(forceReload) {
        if (forceReload || this.untangleNodeReporting === undefined) {
            try {
                this.untangleNodeReporting = rpc.nodeManager.node("untangle-node-reporting");
            } catch (e) {
                Ung.Util.rpcExHandler(e);
            }
        }
        return this.untangleNodeReporting;
    },
    
    listeners: {
        "activate": {
            fn: function() {
                if( this.refreshOnActivate ) {
                    Ext.Function.defer(this.refreshHandler,1, this, [false]);
                }
            }
        },
        "deactivate": {
            fn: function() {
                if(this.autoRefreshEnabled) {
                    this.stopAutoRefresh(true);
                }
            }
        }
    },
    isDirty: function() {
        return false;
    }
});


//Grid for EventLog, with customizable columns 
Ext.define('Ung.GridEventLogCustomizable', {
    extend:'Ung.GridEventLogBuffered',
    enableColumnHide: true,
    enableColumnMove: true,
    enableColumnMenu: true
 });

Ung.CustomEventLog = {
        buildSessionEventLog: function(settingsCmpParam, nameParam, titleParam, helpSourceParam, visibleColumnsParam, eventQueriesFnParam) {
//            var lineNum = Ext.create('Ext.grid.RowNumberer');
//            lineNum.setWidth(50);
            var grid = Ext.create('Ung.GridEventLogCustomizable',{
                name: nameParam,
                settingsCmp: settingsCmpParam,
                helpSource: helpSourceParam,
                eventQueriesFn: eventQueriesFnParam,
                title: titleParam,
                fields: [{
                    name: 'time_stamp',
                    sortType: Ung.SortTypes.asTimestamp
                }, {
                    name: 'priority',
                    mapping: 'bandwidth_priority'
                }, {
                    name: 'rule',
                    mapping: 'bandwidth_rule'
                }, {
                    name: 'username'
                }, {
                    name: 'client_addr',
                    mapping: 'c_client_addr'
                }, {
                    name: 'client_port',
                    mapping: 'c_client_port'
                }, {
                    name: 'server_addr',
                    mapping: 'c_server_addr'
                }, {
                    name: 'server_port',
                    mapping: 's_server_port'
                }, {
                    name: 'application',
                    mapping: 'classd_application',
                    type: 'string'
                }, {
                    name: 'protochain',
                    mapping: 'classd_protochain',
                    type: 'string'
                }, {
                    name: 'flagged',
                    mapping: 'classd_flagged',
                    type: 'boolean'
                }, {
                    name: 'blocked',
                    mapping: 'classd_blocked',
                    type: 'boolean'
                }, {
                    name: 'confidence',
                    mapping: 'classd_confidence'
                }, {
                    name: 'detail',
                    mapping: 'classd_detail'
                }, {
                    name: 'protofilter_blocked',
                    mapping: 'protofilter_blocked'
                }, {
                    name: 'protocol',
                    type: 'string',
                    mapping: 'protofilter_protocol'
                }, {
                    name: 'ruleid',
                    mapping: 'classd_ruleid'

                }],
                columns: [{
                    hidden: visibleColumnsParam.indexOf('time_stamp') < 0,
                    header: i18n._("Timestamp"),
                    width: Ung.Util.timestampFieldWidth,
                    sortable: true,
                    dataIndex: 'time_stamp',
                    renderer: function(value) {
                        return i18n.timestampFormat(value);
                    }
                }, {
                    hidden: visibleColumnsParam.indexOf('client_addr') < 0,
                    header: i18n._("Client"),
                    width: Ung.Util.ipFieldWidth,
                    sortable: true,
                    dataIndex: 'client_addr'
                }, {
                    hidden: visibleColumnsParam.indexOf('client_port') < 0,
                    header: i18n._("Client port"),
                    width: Ung.Util.portFieldWidth,
                    sortable: true,
                    dataIndex: 'client_port'
                }, {
                    hidden: visibleColumnsParam.indexOf('username') < 0,
                    header: i18n._("Username"),
                    width: Ung.Util.usernameFieldWidth,
                    sortable: true,
                    dataIndex: 'username'
                }, {
                    hidden: visibleColumnsParam.indexOf('server_addr') < 0,
                    header: i18n._("Server"),
                    width: Ung.Util.ipFieldWidth,
                    sortable: true,
                    dataIndex: 'server_addr'
                }, {
                    hidden: visibleColumnsParam.indexOf('server_port') < 0,
                    header: i18n._("Server Port"),
                    width: Ung.Util.portFieldWidth, 
                    sortable: true,
                    dataIndex: 'server_port'
                }, {
                    hidden: visibleColumnsParam.indexOf('ruleid') < 0,
                    header: i18n._("Rule ID"),
                    width: 70,
                    sortable: true,
                    dataIndex: 'ruleid'
                }, {
                    hidden: visibleColumnsParam.indexOf('priority') < 0,
                    header: i18n._("Priority"),
                    width: 120,
                    sortable: true,
                    dataIndex: 'priority',
                    renderer: function(value) {
                        if (Ext.isEmpty(value))
                            return "";
                        
                        switch(value) {
                          case 0: return "";
                          case 1: return i18n._("Very High");
                          case 2: return i18n._("High");
                          case 3: return i18n._("Medium");
                          case 4: return i18n._("Low");
                          case 5: return i18n._("Limited");
                          case 6: return i18n._("Limited More");
                          case 7: return i18n._("Limited Severely");
                          default: return Ext.String.format(i18n._("Unknown Priority: {0}"), value);
                        }
                    }
                }, {
                    hidden: visibleColumnsParam.indexOf('rule') < 0,
                    header: i18n._("Rule"),
                    width: 120,
                    sortable: true,
                    dataIndex: 'rule',
                    renderer: function(value) {
                        if (Ext.isEmpty(value))
                            return i18n._("none");
                        return value;
                    }
                }, {
                    hidden: visibleColumnsParam.indexOf('application') < 0,
                    header: i18n._("Application"),
                    width: 120,
                    sortable: true,
                    dataIndex: 'application'
                }, {
                    hidden: visibleColumnsParam.indexOf('protochain') < 0,
                    header: i18n._("ProtoChain"),
                    width: 180,
                    sortable: true,
                    dataIndex: 'protochain'
                }, {
                    hidden: visibleColumnsParam.indexOf('blocked') < 0,
                    header: i18n._("Blocked  (Application Control)"),
                    width: Ung.Util.booleanFieldWidth,
                    sortable: true,
                    dataIndex: 'blocked'
                }, {
                    hidden: visibleColumnsParam.indexOf('flagged') < 0,
                    header: i18n._("Flagged"),
                    width: Ung.Util.booleanFieldWidth,
                    sortable: true,
                    dataIndex: 'flagged'
                }, {
                    hidden: visibleColumnsParam.indexOf('confidence') < 0,
                    header: i18n._("Confidence"),
                    width: Ung.Util.portFieldWidth,
                    sortable: true,
                    dataIndex: 'confidence'
                }, {
                    hidden: visibleColumnsParam.indexOf('detail') < 0,
                    header: i18n._("Detail"),
                    width: 200,
                    sortable: true,
                    dataIndex: 'detail'
                },{
                    hidden: visibleColumnsParam.indexOf('protocol') < 0,
                    header: i18n._("Protocol"),
                    width: 120,
                    sortable: true,
                    dataIndex: 'protocol'
                }, {
                    hidden: visibleColumnsParam.indexOf('protofilter_blocked') < 0,
                    header: i18n._("Blocked (Application Control Lite)"),
                    width: Ung.Util.booleanFieldWidth,
                    sortable: true,
                    dataIndex: 'protofilter_blocked'
                }]
            });
            return grid;
        }
};

// Monitor Grid class
Ext.define('Ung.MonitorGrid', {
    extend:'Ext.grid.Panel',
    selType: 'rowmodel',
    // record per page
    recordsPerPage: 500,
    // settings component
    settingsCmp: null,
    // the list of fields used to by the Store
    fields: null,
    // the default sort field
    sortField: null,
    // the default sort order
    sortOrder: null,
    // the default group field
    groupField: null,
    // the columns are sortable by default, if sortable is not specified
    columnsDefaultSortable: true,
    // paginate the grid by default
    paginated: true,
    async: true,
    //an applicaiton selector
    appList: null,
    // the total number of records
    totalRecords: null,
    autoRefreshEnabled: false,        
    features: [{
        ftype: 'filters',
        encode: false,
        local: true
    }, {
        ftype: 'groupingsummary'
    }],
    constructor: function(config) {
        var defaults = {
            data: [],
            plugins: [
            ],
            viewConfig: {
                enableTextSelection: true,
                stripeRows: true,
                loadMask:{
                    msg: i18n._("Loading...")
                }
            },
            changedData: {},
            subCmps:[]
        };
        Ext.applyIf(config, defaults);
        this.callParent(arguments);
    },
    initComponent: function() {
        for (var i = 0; i < this.columns.length; i++) {
            var col=this.columns[i];
            if( col.sortable == null) {
                col.sortable = this.columnsDefaultSortable;
            }
        }    
        
        if(this.dataFn) {
            if(this.dataRoot === undefined) {
                this.dataRoot="list";
            }
        } else {
            this.async=false;
        }
        
        this.totalRecords = this.data.length;
        this.store=Ext.create('Ext.data.Store',{
            data: [],
            fields: this.fields,
            pageSize: this.paginated?this.recordsPerPage:null,
            proxy: {
                type: this.paginated?'pagingmemory':'memory',
                reader: {
                    type: 'json' 
                }
            },
            autoLoad: false,
            sorters: this.sortField ? {
                property: this.sortField,
                direction: this.sortOrder ? this.sortOrder: "ASC"
            }: null,
            groupField: this.groupField,
            remoteSort: this.paginated,
            remoteFilter: this.paginated
        });
        this.bbar=[];
        if(this.appList!=null) {
            this.bbar.push({
                xtype: 'tbtext',
                id: "appSelectorBox_"+this.getId(),
                text: ''
            });
        }
        this.bbar.push({
            xtype: 'button',
            id: "refresh_"+this.getId(),
            text: i18n._('Refresh'),
            name: "Refresh",
            tooltip: i18n._('Refresh'),
            iconCls: 'icon-refresh',
            handler: Ext.bind(function() {
                this.reload();
            }, this)
        },{
            xtype: 'button',
            id: "auto_refresh_"+this.getId(),
            text: i18n._('Auto Refresh'),
            enableToggle: true,
            pressed: false,
            name: "Auto Refresh",
            tooltip: i18n._('Auto Refresh'),
            iconCls: 'icon-autorefresh',
            handler: Ext.bind(function() {
                var autoRefreshButton=Ext.getCmp("auto_refresh_"+this.getId());
                if(autoRefreshButton.pressed) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            }, this)
        },'-',{
            text: i18n._('Clear Filters'),
            tooltip: i18n._('Filters can be added by clicking on column headers arrow down menu and using Filters menu'),
            handler: Ext.bind(function () {
                this.filters.clearFilters();
            }, this) 
        },{
            text: i18n._('Clear Grouping'),
            tooltip: i18n._('Grouping can be used by clicking on column headers arrow down menu and clicking Group by this field'),
            handler: Ext.bind(function () {
                this.getStore().clearGrouping();
            }, this) 
        });
        if(this.paginated) {
            this.pagingToolbar = Ext.create('Ext.toolbar.Paging',{
                hidden: true,
                disabled: true,
                store: this.getStore(),
                style: "border:0; top:1px;",
                displayInfo: true,
                displayMsg: i18n._('{0} - {1} of {2}'),
                emptyMsg: i18n._("No topics to display")
            });
            this.bbar.push('-',this.pagingToolbar);
        }
        this.callParent(arguments);
    },
    afterRender: function() {
        this.callParent(arguments);
        if(this.appList!=null) {
            out = [];
            out.push('<select name="appSelector" id="appSelector_' + this.getId() + '" onchange="Ext.getCmp(\''+this.getId()+'\').changeApp()">');
            for (i = 0; i < this.appList.length; i++) {
                var app = this.appList[i];
                var selOpt = (app.value === this.dataFnArg) ? "selected": "";
                out.push('<option value="' + app.value + '" ' + selOpt + '>' + app.name + '</option>');
            }
            out.push('</select>');
            Ext.getCmp('appSelectorBox_' + this.getId()).setText(out.join(""));
        }
        
        this.initialLoad();
    },
    setSelectedApp: function(dataFnArg) {
        this.dataFnArg=dataFnArg;
        var selObj = document.getElementById('appSelector_' + this.getId());
        for(var i=0; i< selObj.options.length; i++) {
            if(selObj.options[i].value==dataFnArg) {
                selObj.selectedIndex=i;
                this.reload();
                return;
            }
        }
    },
    getSelectedApp: function() {
        var selObj = document.getElementById('appSelector_' + this.getId());
        var result = null;
        if (selObj !== null && selObj.selectedIndex >= 0) {
            result = selObj.options[selObj.selectedIndex].value;
        }
        return result;
    },
    changeApp: function() {
        this.dataFnArg=this.getSelectedApp();
        this.reload();
    },
    initialLoad: function() {
        this.getView().setLoading(true);
        this.getData({list:[]}); //Inital load with empty data
        this.afterDataBuild(Ext.bind(function() {
            this.getStore().loadPage(1, {
                limit:this.isPaginated() ? this.recordsPerPage: Ung.Util.maxRowCount,
                callback: function() {
                    this.getView().setLoading(false);
                },
                scope: this
            });
        }, this));
    },
    getData: function(data) {
        if(!data) {
            if(this.dataFn) {
                if (this.dataFnArg !== undefined && this.dataFnArg != null) {
                    data = this.dataFn(this.dataFnArg);
                } else {
                    data = this.dataFn();
                }
                this.data = (this.dataRoot!=null && this.dataRoot.length>0) ? data[this.dataRoot]:data;
            }
        } else {
            this.data=(this.dataRoot!=null && this.dataRoot.length>0) ? data[this.dataRoot]:data;
        }

        if(!this.data) {
            this.data=[];
        }
        return this.data;
    },
    buildData: function(handler) {
        if(this.async) {
            if (this.dataFnArg !== undefined && this.dataFnArg != null) {
                this.dataFn(Ext.bind(function(result, exception) {
                    if(Ung.Util.handleException(exception)) return;
                    this.getData(result);
                    this.afterDataBuild(handler);
                }, this),this.dataFnArg);
            } else {
                this.dataFn(Ext.bind(function(result, exception) {
                    if(Ung.Util.handleException(exception)) return;
                    this.getData(result);
                    this.afterDataBuild(handler);
                }, this));
            }
        } else {
            this.getData();
            this.afterDataBuild(handler);
        }

    },
    afterDataBuild: function(handler) {
        this.getStore().getProxy().data = this.data;
        this.setTotalRecords(this.data.length);
        if(handler) {
            handler();
        }
    },
    // is grid paginated
    isPaginated: function() {
        return  this.paginated && (this.totalRecords != null && this.totalRecords >= this.recordsPerPage);
    },
    beforeDestroy: function() {
        Ext.each(this.subCmps, Ext.destroy);
        this.callParent(arguments);
    },
    reload: function() {
        this.getView().setLoading(true);
        Ext.defer(function(){
            this.buildData(Ext.bind(function() {
                this.getStore().loadPage(this.getStore().currentPage, {
                    limit:this.isPaginated() ? this.recordsPerPage: Ung.Util.maxRowCount,
                    callback: function() {
                        this.getView().setLoading(false);
                    },
                    scope: this
                });
            }, this));
        },10, this);
    },
    // Set the total number of records
    setTotalRecords: function(totalRecords) {
        this.totalRecords = totalRecords;
        if(this.paginated) {
            var isPaginated=this.isPaginated();
            this.getStore().pageSize=isPaginated?this.recordsPerPage:Ung.Util.maxRowCount;
            if(!isPaginated) {
                //Needs to set currentPage to 1 when not using pagination toolbar.
                this.getStore().currentPage=1;
            }
            var bbar=this.getDockedItems('toolbar[dock="bottom"]')[0];
            if (isPaginated) {
                this.pagingToolbar.show();
                this.pagingToolbar.enable();
            } else {
                this.pagingToolbar.hide();
                this.pagingToolbar.disable();
            }
        }
    },
    startAutoRefresh: function(setButton) {
        this.autoRefreshEnabled=true;
        if(setButton) {
            var autoRefreshButton=Ext.getCmp("auto_refresh_"+this.getId());
            autoRefreshButton.toggle(true);
        }
        var refreshButton=Ext.getCmp("refresh_"+this.getId());
        refreshButton.disable();
        this.autorefreshList();

    },
    stopAutoRefresh: function(setButton) {
        this.autoRefreshEnabled=false;
        if(setButton) {
            var autoRefreshButton=Ext.getCmp("auto_refresh_"+this.getId());
            autoRefreshButton.toggle(false);
        }
        var refreshButton=Ext.getCmp("refresh_"+this.getId());
        refreshButton.enable();
    },
    autorefreshList: function() {
        if(this!=null && this.autoRefreshEnabled && Ext.getCmp(this.id) != null) {
            this.reload();
            Ext.defer(this.autorefreshList, 9000, this);
        }
    },
    isDirty: function() {
        return false;
    }
});

// Standard Ung window
Ext.define('Ung.Window', {
    extend: 'Ext.window.Window',
    modal: true,
    // window title
    title: null,
    // breadcrumbs
    breadcrumbs: null,
    draggable: false,
    resizable: false,
    // sub componetns - used by destroy function
    subCmps: null,
    // size to rack right side on show
    sizeToRack: true,
    layout: 'anchor',
    defaults: {
        anchor: '100% 100%',
        autoScroll: true,
        autoWidth: true
    },
    constructor: function(config) {
        var defaults = {
            closeAction: 'cancelAction' 
        };
        Ext.applyIf(config, defaults);
        this.subCmps = [];
        this.callParent(arguments);
    },
    initComponent: function() {
        if (!this.title) {
            this.title = '<span id="title_' + this.getId() + '"></span>';
        }
        this.callParent(arguments);
    },
    afterRender: function() {
        this.callParent(arguments);
        if (this.name && this.getEl()) {
            this.getEl().set({
                'name': this.name
            });
        }
        if (this.breadcrumbs) {
            this.subCmps.push(new Ung.Breadcrumbs({
                renderTo: 'title_' + this.getId(),
                elements: this.breadcrumbs
            }));
        }
        Ext.QuickTips.init();      
    },

    beforeDestroy: function() {
        Ext.each(this.subCmps, Ext.destroy);
        this.callParent(arguments);
    },
    // on show position and size
    onShow: function() {
        if (this.sizeToRack) {
            this.setSizeToRack();
        }
        this.callParent(arguments);
    },
    setSizeToRack: function () {
        var objSize = main.viewport.getSize();
        objSize.width = objSize.width - main.contentLeftWidth;
        this.setPosition(main.contentLeftWidth, 0);
        this.setSize(objSize);
    },

    // to override if needed
    isDirty: function() {
        return false;
    },
    cancelAction: function(handler) {
        if (this.isDirty()) {
            Ext.MessageBox.confirm(i18n._('Warning'), i18n._('There are unsaved settings which will be lost. Do you want to continue?'),
                Ext.bind(function(btn) {
                if (btn == 'yes') {
                    this.closeWindow(handler);
                }
            }, this));
        } else {
            this.closeWindow(handler);
        }
    },
    close: function() {
        //Need to override default Ext.Window method to fix issue #10238
        if (this.fireEvent('beforeclose', this) !== false) {
            this.cancelAction();
        }
    },
    // the close window action
    // to override
    closeWindow: function(handler) {
        this.hide();
        if(handler) {
            handler();
        }
    }
});

Ung.Window.cancelAction = function(dirty, closeWinFn) {
    if (dirty) {
        Ext.MessageBox.confirm(i18n._('Warning'), i18n._('There are unsaved settings which will be lost. Do you want to continue?'),
            function(btn) {
                if (btn == 'yes') {
                    closeWinFn();
                }
            });
    } else {
        closeWinFn();
    }
};

Ext.define("Ung.SettingsWin", {
    extend: "Ung.Window",
    // config i18n
    i18n: null,
    // holds the json rpc results for the settings classes
    rpc: null,
    // tabs (if the window has tabs layout)
    tabs: null,
    dirtyFlag: false,
    hasApply: true,
    layout: 'fit',
    // build Tab panel from an array of tab items
    constructor: function(config) {
        config.rpc = {};
        var objSize = main.viewport.getSize();
        Ext.applyIf(config, {
            height: objSize.height,
            width: objSize.width - main.contentLeftWidth,
            x: main.contentLeftWidth,
            y: 0
        });
        this.callParent(arguments);
    },
    buildTabPanel: function(itemsArray) {
        Ext.get("racks").hide();
        this.tabs = Ext.create('Ext.tab.Panel',{
            activeTab: 0,
            deferredRender: false,
            parentId: this.getId(),
            items: itemsArray
        });
        this.items=this.tabs;
        this.tabs.on('afterrender', function() {
            Ext.get("racks").show();
            Ext.defer(this.openTarget,1, this);
        }, this);
    },
    openTarget: function() {
        if(main.target) {
            var targetTokens = main.target.split(".");
            if(targetTokens.length >= 3 && targetTokens[2] !=null ) {
                var tabIndex = this.tabs.items.findIndex('name', targetTokens[2]);
                if(tabIndex != -1) {
                    this.tabs.setActiveTab(tabIndex);
                    if(targetTokens.length >= 4 && targetTokens[3] !=null ) {
                        var activeTab = this.tabs.getActiveTab();
                        var compArr = this.tabs.query('[name="'+targetTokens[3]+'"]');
                        if(compArr.length > 0) {
                            var comp = compArr[0];
                            if(comp) {
                                console.log(comp, comp.xtype, comp.getEl(), comp.handler);
                                if(comp.xtype == "panel") {
                                    var tabPanel = comp.up('tabpanel');
                                    if(tabPanel) {
                                        tabPanel.setActiveTab(comp);    
                                    }
                                } else if(comp.xtype == "button") {
                                    comp.getEl().dom.click();
                                }
                            }
                        }
                    }
                }
            }
            main.target = null;
        }
    },
    helpAction: function() {
        var helpSource;
        if(this.tabs && this.tabs.getActiveTab()!=null) {
            if( this.tabs.getActiveTab().helpSource != null ) {
                helpSource = this.tabs.getActiveTab().helpSource;
            } else if( Ext.isFunction(this.tabs.getActiveTab().getHelpSource)) {
                helpSource = this.tabs.getActiveTab().getHelpSource();
            }

        } else {
            helpSource = this.helpSource;
        }

        main.openHelp(helpSource);
    },
    closeWindow: function(handler) {
        Ext.get("racks").show();
        this.hide();
        Ext.destroy(this);
        if(handler) {
            handler();
        }
    },
    isDirty: function() {
        return this.dirtyFlag || Ung.Util.isDirty(this.tabs);
    },
    markDirty: function() {
        this.dirtyFlag=true;
    },
    clearDirty: function() {
        this.dirtyFlag=false;
        Ung.Util.clearDirty(this.tabs);
    },
    applyAction: function() {
        this.saveAction(true);
    },
    saveAction: function (isApply) {
        if(!this.isDirty()) {
            if(!isApply) {
                this.closeWindow();
            }
            return;
        }
        if(!this.validate()) {
            return;
        }
        Ext.MessageBox.wait(i18n._("Saving..."), i18n._("Please wait"));
        if(Ext.isFunction(this.beforeSave)) {
            this.beforeSave(isApply, this.save);
        } else {
            this.save.call(this, isApply);
        }
    },
    //To Override
    save: function(isApply) {
        Ext.MessageBox.hide();
        if (!isApply) {
            this.closeWindow();
        } else {
            this.clearDirty();
            if(Ext.isFunction(this.afterSave)) {
                this.afterSave.call(this);
            }
        }
    },
    // validation functions, to override if needed
    validate: function() {
        return true;
    }
});
// Node Settings Window
Ext.define("Ung.NodeWin", {
    extend: "Ung.SettingsWin",
    node: null,
    constructor: function(config) {
        var nodeName=config.node.name;
        this.id = "nodeWin_" + nodeName + "_" + rpc.currentPolicy.policyId;
        // initializes the node i18n instance
        config.i18n = Ung.i18nModuleInstances[nodeName];
        this.callParent(arguments);
    },
    initComponent: function() {
        if (this.helpSource == null) {
            this.helpSource = this.node.helpSource;
        }
        this.breadcrumbs = [{
            title: i18n._(rpc.currentPolicy.name),
            action: Ext.bind(function() {
                this.cancelAction(); // TODO check if we need more checking
            }, this)
        }, {
            title: this.node.displayName
        }];
        if(this.bbar==null) {
            this.bbar=["-",{
                name: "Remove",
                id: this.getId() + "_removeBtn",
                iconCls: 'node-remove-icon',
                text: i18n._('Remove'),
                handler: Ext.bind(function() {
                    this.removeAction();
                }, this)
            },"-",{
                name: 'Help',
                id: this.getId() + "_helpBtn",
                iconCls: 'icon-help',
                text: i18n._('Help'),
                handler: Ext.bind(function() {
                    this.helpAction();
                }, this)
            },'->',{
                name: "Save",
                id: this.getId() + "_saveBtn",
                iconCls: 'save-icon',
                text: i18n._('OK'),
                handler: Ext.bind(function() {
                    Ext.Function.defer(this.saveAction,1, this,[false]);
                }, this)
            },"-",{
                name: "Cancel",
                id: this.getId() + "_cancelBtn",
                iconCls: 'cancel-icon',
                text: i18n._('Cancel'),
                handler: Ext.bind(function() {
                    this.cancelAction();
                }, this)
            },"-"];
            if(this.hasApply) {
                this.bbar.push({
                    name: "Apply",
                    id: this.getId() + "_applyBtn",
                    iconCls: 'apply-icon',
                    text: i18n._('Apply'),
                    handler: Ext.bind(function() {
                        Ext.Function.defer(this.applyAction,1, this);
                    }, this)
                },"-");
            }
        }
        this.callParent(arguments);
    },
    removeAction: function() {
        this.node.removeAction();
    },
    // get rpcNode object
    getRpcNode: function() {
        return this.node.rpcNode;
    },
    // get node settings object
    getSettings: function(handler) {
        if (handler !== undefined || this.settings === undefined) {
            if(Ext.isFunction(handler)) {
                this.getRpcNode().getSettings(Ext.bind(function(result, exception) {
                    if(Ung.Util.handleException(exception)) return;
                    this.settings = result;
                    handler.call(this);
                }, this));
            } else {
                try {
                    this.settings = this.getRpcNode().getSettings();
                } catch (e) {
                    Ung.Util.rpcExHandler(e);
                }
            }
        }
        return this.settings;
    },
    // get Validator object
    getValidator: function() {
        if (this.node.rpcNode.validator === undefined) {
            try {
                this.node.rpcNode.validator = this.getRpcNode().getValidator();
            } catch (e) {
                Ung.Util.rpcExHandler(e);
            }
        }
        return this.node.rpcNode.validator;
    },
    save: function(isApply) {
        this.getRpcNode().setSettings( Ext.bind(function(result,exception) {
            Ext.MessageBox.hide();
            if(Ung.Util.handleException(exception)) return;
            if (!isApply) {
                this.closeWindow();
                return;
            } else {
                Ext.MessageBox.wait(i18n._("Reloading..."), i18n._("Please wait"));
                this.getSettings(function() {
                    this.clearDirty();
                    if(Ext.isFunction(this.afterSave)) {
                        this.afterSave.call(this);
                    }
                    Ext.MessageBox.hide();
                });
            }
        }, this), this.getSettings());
    },
    reload: function() {
        var nodeWidget=this.node;
        this.closeWindow();
        nodeWidget.onSettingsAction();
    }
});
Ung.NodeWin._nodeScripts = {};

// Dynamically loads javascript file for a node
Ung.NodeWin.loadNodeScript = function(settingsCmp, handler) {
    var scriptFile = Ung.Util.getScriptSrc('settings.js');
    Ung.Util.loadScript('script/' + settingsCmp.name + '/' + scriptFile, Ext.bind(function() {
        this.settingsClassName = Ung.NodeWin.getClassName(this.name);
        if(!Ung.NodeWin.dependency[this.name]) {
            handler.call(this);
        } else {
            var dependencyClassName=Ung.NodeWin.getClassName(Ung.NodeWin.dependency[this.name].name);
            if(!dependencyClassName) {
                Ung.Util.loadScript('script/' + Ung.NodeWin.dependency[this.name].name + '/' + scriptFile, Ext.bind(function() {
                    Ung.NodeWin.dependency[this.name].fn.call(this);
                    handler.call(this);
                }, this));
            } else {
                Ung.NodeWin.dependency[this.name].fn.call(this);
                handler.call(this);
            }
        }
    },settingsCmp));
};

Ung.NodeWin.classNames = {};
Ung.NodeWin.dependency = {};
// Static function get the settings class name for a node
Ung.NodeWin.getClassName = function(name) {
    var className = Ung.NodeWin.classNames[name];
    return className === undefined ? null: className;
};
// Static function to register a settings class name for a node
Ung.NodeWin.registerClassName = function(name, className) {
    Ung.NodeWin.classNames[name] = className;
};

// Config Window (Save/Cancel/Apply)
Ext.define("Ung.ConfigWin", {
    extend: "Ung.SettingsWin",
    // class constructor
    constructor: function(config) {
        this.id = "configWin_" + config.name;
        // for config elements we have the untangle-libuvm translation map
        this.i18n = i18n;
        this.callParent(arguments);
    },
    initComponent: function() {
        if (!this.name) {
            this.name = "configWin_" + this.name;
        }
        if(this.bbar==null) {
            this.bbar=['-',{
                name: 'Help',
                id: this.getId() + "_helpBtn",
                iconCls: 'icon-help',
                text: i18n._("Help"),
                handler: Ext.bind(function() {
                    this.helpAction();
                }, this)
            },'->',{
                name: 'Save',
                id: this.getId() + "_saveBtn",
                iconCls: 'save-icon',
                text: i18n._("OK"),
                handler: Ext.bind(function() {
                    Ext.Function.defer(this.saveAction,1, this,[false]);
                }, this)
            },"-",{
                name: 'Cancel',
                id: this.getId() + "_cancelBtn",
                iconCls: 'cancel-icon',
                text: i18n._("Cancel"),
                handler: Ext.bind(function() {
                    this.cancelAction();
                }, this)
            },"-"];
            if(this.hasApply) {
                this.bbar.push({
                    name: "Apply",
                    id: this.getId() + "_applyBtn",
                    iconCls: 'apply-icon',
                    text: i18n._("Apply"),
                    handler: Ext.bind(function() {
                        Ext.Function.defer(this.applyAction,1, this,[true]);
                    }, this)
                },"-");
            }
        }
        this.callParent(arguments);
    }
});

// Status Window (just a close button)
Ext.define("Ung.StatusWin", {
    extend: "Ung.SettingsWin",
    // class constructor
    constructor: function(config) {
        this.id = "statusWin_" + config.name;
        // for config elements we have the untangle-libuvm translation map
        this.i18n = i18n;
        this.callParent(arguments);
    },
    initComponent: function() {
        if (!this.name) {
            this.name = "statusWin_" + this.name;
        }
        if(this.bbar==null) {
            this.bbar=['-',{
                name: 'Help',
                id: this.getId() + "_helpBtn",
                iconCls: 'icon-help',
                text: i18n._("Help"),
                handler: Ext.bind(function() {
                    this.helpAction();
                }, this)
            },"->",{
                name: 'Close',
                id: this.getId() + "_closeBtn",
                iconCls: 'cancel-icon',
                text: i18n._("Close"),
                handler: Ext.bind(function() {
                    this.cancelAction();
                }, this)
            },"-"];
        }
        this.callParent(arguments);
    },
    isDirty: function() {
        return false;   
    }

});

// update window 
// has the content and 3 standard buttons: Save, Cancel, Apply
Ext.define('Ung.UpdateWindow', {
    extend: 'Ung.Window',
    initComponent: function() {
        if(this.bbar==null) {
            this.bbar=[
            '->',
            {
                name: "Save",
                id: this.getId() + "_saveBtn",
                iconCls: 'save-icon',
                text: i18n._('Save'),
                handler: Ext.bind(function() {
                    Ext.Function.defer(this.saveAction,1, this);
                }, this)
            },'-',{
                name: "Cancel",
                id: this.getId() + "_cancelBtn",
                iconCls: 'cancel-icon',
                text: i18n._('Cancel'),
                handler: Ext.bind(function() {
                    this.cancelAction();
                }, this)
            },'-',{
                name: "Apply",
                id: this.getId() + "_applyBtn",
                iconCls: 'apply-icon',
                text: i18n._('Apply'),
                handler: Ext.bind(function() {
                    Ext.Function.defer(this.applyAction,1, this, []);
                }, this)
            },'-'];
        }
        this.callParent(arguments);
    },
    // the update actions
    // to override
    updateAction: function() {
        Ung.Util.todo();
    },
    saveAction: function() {
        Ung.Util.todo();
    },
    applyAction: function() {
        Ung.Util.todo();
    }
});

// edit window 
// has the content and 2 standard buttons:  Cancel/Done
// Done just closes the window and updates the data in the browser but does not save
Ext.define('Ung.EditWindow', {
    extend: 'Ung.Window',
    initComponent: function() {
        if(this.bbar==null) {
            this.bbar=[];
            if(this.helpSource) {
                this.bbar.push('-', {
                    name: 'Help',
                    id: this.getId() + "_helpBtn",
                    iconCls: 'icon-help',
                    text: i18n._("Help"),
                    handler: Ext.bind(function() {
                        this.helpAction();
                    }, this)
                });
            }
            this.bbar.push(
                '->',
                {
                    name: "Cancel",
                    id: this.getId() + "_cancelBtn",
                    iconCls: 'cancel-icon',
                    text: i18n._('Cancel'),
                    handler: Ext.bind(function() {
                        this.cancelAction();
                    }, this)
                },'-',{
                    name: "Done",
                    id: this.getId() + "_doneBtn",
                    iconCls: 'apply-icon',
                    text: i18n._('Done'),
                    handler: Ext.bind(function() {
                        Ext.defer(this.updateAction,1, this);
                    }, this)
            },'-');
        }
        this.callParent(arguments);
    },
    // the update actions
    // to override
    updateAction: function() {
        Ung.Util.todo();
    },
    // on click help
    helpAction: function() {
        main.openHelp(this.helpSource);
    }

});

// Manage list popup window
Ext.define("Ung.ManageListWindow", {
    extend: "Ung.UpdateWindow",
    // the editor grid
    grid: null,
    layout: 'fit',
    initComponent: function() {
        this.items=this.grid;
        this.callParent(arguments);
    },
    closeWindow: function(skipLoad) {
        if(!skipLoad) {
            this.grid.reload();
        }
        this.hide();
    },
    isDirty: function() {
        return this.grid.isDirty();
    },
    updateAction: function() {
        this.hide();
    },
    saveAction: function() {
        this.applyAction(Ext.bind(this.hide, this));
    }
});

// Row editor window used by editor grid
Ext.define('Ung.RowEditorWindow', {
    extend:'Ung.EditWindow',
    // the editor grid
    grid: null,
    // input lines for standard input lines (text, checkbox, textarea, ..)
    inputLines: null,
    // extra validate function for row editor
    validate: null,
    // label width for row editor input lines
    rowEditorLabelWidth: null,
    // the record currently edit
    record: null,
    // initial record data
    initialRecordData: null,
    sizeToRack: false,
    // size to grid on show
    sizeToGrid: false,
    //size to a given component
    sizeToComponent: null,
    sizeToParent: false,
    addMode: null,
    layout: "fit",
    initComponent: function() {
        if (!this.height && !this.width && !this.sizeToComponent) {
            this.sizeToGrid = true;
        }
        
        if (this.title == null) {
            this.title = i18n._('Edit');
        }
        if (this.rowEditorLabelWidth == null) {
            this.rowEditorLabelWidth = 100;
        }
        this.items = Ext.create('Ext.panel.Panel',{
            buttonAlign: 'right',
            border: false,
            bodyStyle: 'padding:10px 10px 0px 10px;',
            autoScroll: true,
            layout: "auto",
            defaults: {
                selectOnFocus: true,
                labelWidth: this.rowEditorLabelWidth
            },
            items: this.inputLines
        });
        this.callParent(arguments);
    },
    show: function() {
        Ung.UpdateWindow.superclass.show.call(this);
        if(!this.sizeToComponent) {
            if(this.sizeToParent) {
                this.sizeToComponent=this.grid.findParentByType("panel");
            }
            if(!this.sizeToComponent) {
                this.sizeToComponent=this.grid;    
            }
        }
        var objPosition = this.sizeToComponent.getPosition();
        if (this.sizeToComponent || this.height==null || this.width==null) {
            var objSize = this.sizeToComponent.getSize();
            this.setSize(objSize);
            if (objPosition[1] + objSize.height > main.viewport.getSize().height) {
                objPosition[1] = Math.max(main.viewport.getSize().height - objSize.height,0);
            }
        }
        this.setPosition(objPosition);
    },
    populate: function(record,addMode) {
        this.addMode=addMode;
        this.record = record;
        this.initialRecordData = Ext.encode(record.data);
        this.populateRecursive(this.items, record, 0);
        if(Ext.isFunction(this.syncComponents)) {
            this.syncComponents();    
        }
        Ung.Util.clearDirty(this.items);
    },
    populateRecursive: function(component, record, depth) {
        if (component == null) {
            return;
        }
        if(depth>30) {
            console.log("Ung.RowEditorWindow.populateRecursive depth>30");
            return;
        }
        if (component.dataIndex != null) {
            component.suspendEvents();
            component.setValue(record.get(component.dataIndex), record);
            component.resumeEvents();
            return;
        }
        if (component.items) {
            for (var i = 0; i < component.items.length; i++) {
                var item = Ext.isFunction(component.items.get)?component.items.get(i):component.items[i];
                this.populateRecursive( item, record, depth+1);
            }
        }
    },
    updateAction: function() {
        if (this.isFormValid()!==true) {
            return false;
        }
        if (this.record !== null) {
            var data = {};
            this.updateActionRecursive(this.items, data, 0);
            this.record.set(data);
            if(this.addMode) {
                if (this.grid.addAtTop) {
                    this.grid.getStore().insert(0, [this.record]);
                } else {
                    this.grid.getStore().add([this.record]);
                }
                this.grid.updateChangedData(this.record, "added");
            }
        }
        this.hide();
        return true;
        
        
    },
    updateActionRecursive: function(component, data, depth) {
        if (component == null) {
            return;
        }
        if(depth>30) {
            console.log("Ung.RowEditorWindow.updateActionRecursive depth>30");
            return;
        }
        if (component.dataIndex != null) {
            data[component.dataIndex]= component.getValue();
            return;
        }
        if (component.items) {
            for (var i = 0; i < component.items.length; i++) {
                var item = Ext.isFunction(component.items.get)?component.items.get(i):component.items[i];
                this.updateActionRecursive( item, data, depth+1);
            }
        }
    },
    // check if the form is valid;
    // this is the default functionality which can be overwritten
    isFormValid: function() {
        var validResult = this.isFormValidRecursive(this, 0);
        if(validResult && this.validate!=null) {
            validResult = this.validate(this.items);
        }
        if(validResult!==true) {
            var errMsg = i18n._("The form is not valid!");
            if(validResult!==false) {
                errMsg = validResult;
            }
            Ext.MessageBox.alert(i18n._('Warning'), errMsg);
        }
        return validResult;
    },
    isFormValidRecursive: function(component, depth) {
        if (component == null) {
            return true;
        }
        if(depth>30) {
            console.log("Ung.RowEditorWindow.isFormValidRecursive depth>30");
            return true;
        }
        if (component.dataIndex) {
            return Ext.isFunction(component.isValid)?component.isValid():Ung.Util.isValid(component);
        }
        if (component.items) {
            for (var i = 0; i < component.items.length; i++) {
                var item = Ext.isFunction(component.items.get)?component.items.get(i):component.items[i];
                var isValidItem = this.isFormValidRecursive( item, depth+1);
                if(isValidItem !==true) {
                    return isValidItem;
                }
            }
        }
        return true;
    },
    isDirty: function() {
        return Ung.Util.isDirty(this.items);
    },
    closeWindow: function() {
        this.record.data = Ext.decode(this.initialRecordData);
        this.hide();
    }
});

// Grid edit column
Ext.define('Ung.grid.EditColumn', {
    extend:'Ext.grid.column.Action',
    menuDisabled: true,
    resizable: false,
    iconCls: 'icon-edit-row',
    constructor: function(config) {
        if (!config.header) {
            config.header = i18n._("Edit");
        }
        if (!config.width) {
            config.width = 50;
        }
        this.callParent(arguments);
    },
    init: function(grid) {
        this.grid = grid;
    },
    handler: function(view, rowIndex, colIndex) {
        var rec = view.getStore().getAt(rowIndex);
        this.grid.editHandler(rec);
    }
});

// Grid edit column
Ext.define('Ung.grid.DeleteColumn', {
    extend:'Ext.grid.column.Action',
    menuDisabled: true,
    resizable: false,
    iconCls: 'icon-delete-row',
    constructor: function(config) {
        if (!config.header) {
            config.header = i18n._("Delete");
        }
        if (!config.width) {
            config.width = 55;
        }
        this.callParent(arguments);
    },
    init:function(grid) {
        this.grid=grid;
    },
    handler: function(view, rowIndex, colIndex) {
        var rec = view.getStore().getAt(rowIndex);
        this.grid.deleteHandler(rec);
    }
});

// Grid reorder column
Ext.define('Ung.grid.ReorderColumn', {
    extend:'Ext.grid.column.Template',
    menuDisabled:true,
    resizable: false,
    header:i18n._("Reorder"),
    width: 55,
    tpl:'<img src="'+Ext.BLANK_IMAGE_URL+'" class="icon-drag"/>'
});

// Editor Grid class
Ext.define('Ung.EditorGrid', {
    extend:'Ext.grid.Panel',
    selType: 'rowmodel',
    //reserveScrollbar: true,
    // record per page
    recordsPerPage: 25,
    // the minimum number of records for pagination
    minPaginateCount: 65,
    // the total number of records
    totalRecords: null,
    // settings component
    settingsCmp: null,
    // the list of fields used to by the Store
    fields: null,
    // has Add button
    hasAdd: true,
    // should add add rows at top or bottom
    addAtTop: true,
    configAdd: null,
    // has Import Export buttons
    hasImportExport: null,    
    // has Edit buton on each record
    hasEdit: true,
    configEdit: null,
    // has Delete buton on each record
    hasDelete: true,
    configDelete: null,
    // the default Empty record for a new row
    hasReorder: false,
    hasInlineEditor:true,
    configReorder: null,
    // the default Empty record for a new row
    emptyRow: null,
    // input lines used by the row editor
    rowEditorInputLines: null,
    // label width for row editor input lines
    rowEditorLabelWidth: null,
    //size row editor to component
    rowEditorConfig: null,
    // the default sort field
    sortField: null,
    // the default sort order
    sortOrder: null,
    // the default group field
    groupField: null,
    // the columns are sortable by default, if sortable is not specified
    columnsDefaultSortable: null,
    // is the column header dropdown disabled
    columnMenuDisabled: true,
    // paginate the grid by default
    paginated: true,
    // javaClass of the record, used in save function to create correct json-rpc
    // object
    recordJavaClass: null,
    async: false,
    // the map of changed data in the grid
    dataLoaded: false,
    dataInitialized: false,
    // used by rendering functions and by save
    importSettingsWindow: null,    
    enableColumnHide: false,
    enableColumnMove: false,
    dirtyFlag: false,
    addedId: 0,
    generatedId: 1,
    useServerIds: false,
    sortingDisabled:false,
    features: [{ftype: "grouping"}],
    constructor: function(config) {
        var defaults = {
            data: [],
            plugins: [],
            viewConfig: {
                enableTextSelection: true,
                stripeRows: true,
                listeners: {
                    "drop": {
                        fn: Ext.bind(function() {
                            this.markDirty();
                        }, this)
                    }
                },
                loadMask:{
                    msg: i18n._("Loading...")
                }
            },
            changedData: {},
            subCmps:[]
        };
        Ext.applyIf(config, defaults);
        this.callParent(arguments);
    },
    
    initComponent: function() {
        if(this.hasInlineEditor) {
            this.inlineEditor=Ext.create('Ext.grid.plugin.CellEditing', {
                clicksToEdit: 1
            });
            this.plugins.push(this.inlineEditor);
        }
        if (this.hasReorder) {
            this.paginated=false;
            var reorderColumn = Ext.create('Ung.grid.ReorderColumn', this.configReorder || {});
            this.columns.push(reorderColumn);
            
            this.viewConfig.plugins= {
                ptype: 'gridviewdragdrop',
                dragText: i18n._('Drag and drop to reorganize')
            };
            this.columnsDefaultSortable = false;
        }
        for (var i = 0; i < this.columns.length; i++) {
            var col=this.columns[i];
            col.menuDisabled = this.columnMenuDisabled ;
            if( col.sortable == null) {
                col.sortable = this.columnsDefaultSortable;
            }
        }    
        if (this.hasEdit) {
            var editColumn = Ext.create('Ung.grid.EditColumn', this.configEdit || {});
            this.plugins.push(editColumn);
            this.columns.push(editColumn);
        }
        if (this.hasDelete) {
            var deleteColumn = Ext.create('Ung.grid.DeleteColumn', this.configDelete || {});
            this.plugins.push(deleteColumn);
            this.columns.push(deleteColumn);
        }
        //Use internal ids for all operations
        this.fields.push({
            name: 'internalId',
            mapping: null
        });
        
        if(this.dataFn) {
            if(this.dataRoot === undefined) {
                this.dataRoot="list";
            }
        } else {
            this.async=false;
        }
        
        this.totalRecords = this.data.length;
        this.store=Ext.create('Ext.data.Store',{
            data: [],
            fields: this.fields,
            pageSize: this.paginated?this.recordsPerPage:null,
            proxy: {
                type: this.paginated?'pagingmemory':'memory',
                reader: {
                    type: 'json' 
                }
            },
            autoLoad: false,
            sorters: this.sortField ? {
                property: this.sortField,
                direction: this.sortOrder ? this.sortOrder: "ASC"
            }: null,
            groupField: this.groupField,
            remoteSort: this.paginated,
            remoteFilter: this.paginated,
            listeners: {
                "update": {
                    fn: Ext.bind(function(store, record, operation) {
                        this.updateChangedData(record, "modified");
                    }, this)
                },
                "load": {
                    fn: Ext.bind(function(store, records, successful, options, eOpts) {
                        this.updateFromChangedData(store,records);
                    }, this)
                }
            }
        });
        if(!this.dockedItems)  {
            this.dockedItems = [];
        }
        if(this.paginated) {
            this.dockedItems.push({
                dock: 'bottom',
                xtype: 'pagingtoolbar',
                store: this.getStore(),
                displayInfo: true,
                displayMsg: i18n._('Displaying topics {0} - {1} of {2}'),
                emptyMsg: i18n._("No topics to display")
            });
        }

        if (this.tbar == null) {        
            this.tbar=[];
        }
        if(this.hasImportExport===null) {
            this.hasImportExport=this.hasAdd;
        }
        if (this.hasAdd) {
            this.tbar.push(Ext.applyIf(this.configAdd || {}, {
                text: i18n._('Add'),
                tooltip: i18n._('Add New Row'),
                iconCls: 'icon-add-row',
                name: 'Add',
                parentId: this.getId(),
                handler: Ext.bind(this.addHandler, this)
            }));
        }
        if (this.hasImportExport) {
            this.tbar.push('->', {
                text: i18n._('Import'),
                tooltip: i18n._('Import From File'),
                iconCls: 'icon-import',
                name: 'Import',
                parentId: this.getId(),
                handler: Ext.bind(this.importHandler, this)
            }, {
                text: i18n._('Export'),
                tooltip: i18n._('Export To File'),
                iconCls: 'icon-export',
                name: 'export',
                parentId: this.getId(),
                handler: Ext.bind(this.exportHandler, this)
            },'-');        
        }
        this.callParent(arguments);
    },
    afterRender: function() {
        this.callParent(arguments);
        var grid=this;
        this.getView().getRowClass = function(record, index, rowParams, store) {
            var id = record.get("internalId");
            if (id == null || id < 0) {
                return "grid-row-added";
            } else {
                var d = grid.changedData[id];
                if (d) {
                    if (d.op == "deleted") {
                        return "grid-row-deleted";
                    } else {
                        return "grid-row-modified";
                    }
                }
            }
            return "";
        };

        if (this.rowEditor==null) {
            if(this.rowEditorInputLines != null) {
                this.rowEditor = Ext.create('Ung.RowEditorWindow', {
                    grid: this,
                    inputLines: this.rowEditorInputLines,
                    rowEditorLabelWidth: this.rowEditorLabelWidth,
                    helpSource: this.rowEditorHelpSource
                });
            } else if (this.rowEditorConfig != null) {
                this.rowEditor = Ext.create('Ung.RowEditorWindow', Ext.applyIf( this.rowEditorConfig, {grid: this}));
            }
        }
        if(this.rowEditor!=null) {
            this.subCmps.push(this.rowEditor);
        }
        
        if ( (undefined !== this.tooltip) && (undefined !== this.header) && ( undefined !== this.header.dom ) ) {
            Ext.QuickTips.register({
                target: this.header.dom,
                title: '',
                text: this.tooltip,
                enabled: true,
                showDelay: 20
            });
        }
        this.initialLoad();
    },
    initialLoad: function() {
        // load first page initialy
        this.getView().setLoading(false);  //set to false to prevent showing load mask on inital load.
        Ext.defer(function(){
            this.buildData(Ext.bind(function() {
                this.getStore().loadPage(1, {
                    limit:this.isPaginated() ? this.recordsPerPage: Ung.Util.maxRowCount,
                    callback: function() {
                        this.dataLoaded=true;
                        //must call this even when setLoading was not set to true, or prevent reload error
                        this.getView().setLoading(false);
                    },
                    scope: this
                });
            }, this));
        },10, this);
    },
    getTestRecord:function(index) {
        var rec= {};
        var property;
        for (var i=0; i<this.fields.length ; i++) {
            property = (this.fields[i].mapping != null)?this.fields[i].mapping:this.fields[i].name;
            rec[property]=
                (property=='id')?index+1:
                (property=='time_stamp')?{javaClass:"java.util.Date", time: (new Date(i*10000)).getTime()}:
                    property+"_"+(i*(index+1))+"_"+Math.floor((Math.random()*10));
        }
        return rec;
    },
    getData: function(data) {
        if(!data) {
            if(this.dataFn) {
                if (this.dataFnArg !== undefined && this.dataFnArg != null) {
                    data = this.dataFn(this.dataFnArg);
                } else {
                    data = this.dataFn();
                }
                this.data = (this.dataRoot!=null && this.dataRoot.length>0) ? data[this.dataRoot]:data;
            } else if(this.dataProperty) {
                this.data=this.settingsCmp.settings[this.dataProperty].list;
            } else if(this.dataExpression) {
                this.data=eval("this.settingsCmp."+this.dataExpression);
            }
        } else {
            this.data=data;
        }

        if(!this.data) {
            this.data=[];
        }
        if(testMode && this.data.length === 0) {
            if(this.testData) {
                this.data.concat(this.testData);
            } else if(this.testDataFn) {
                this.data.concat(this.testDataFn);
            } else if(this.data.length === 0) {
                var emptyRec={};
                var length = Math.floor((Math.random()*5));
                for(var t=0; t<length; t++) {
                    this.data.push(this.getTestRecord(t));
                }
            }
        }
        for(var i=0; i<this.data.length; i++) {
            this.data[i]["internalId"]=i+1;
            //prevent using ids from server
            if(!this.useServerIds) {
                delete this.data[i]["id"];
            }
        }
        this.dataInitialized=true;
        return this.data;
    },
    buildData: function(handler) {
        if(this.async) {
            if (this.dataFnArg !== undefined && this.dataFnArg != null) {
                this.dataFn(Ext.bind(function(result, exception) {
                    if(Ung.Util.handleException(exception)) return;
                    this.getData(result);
                    this.afterDataBuild(handler);
                }, this),this.dataFnArg);
            } else {
                this.dataFn(Ext.bind(function(result, exception) {
                    if(Ung.Util.handleException(exception)) return;
                    this.getData(result);
                    this.afterDataBuild(handler);
                }, this));
            }
        } else {
            this.getData();
            this.afterDataBuild(handler);
        }

    },
    afterDataBuild: function(handler) {
        this.getStore().getProxy().data = this.data;
        this.setTotalRecords(this.data.length);
        if(handler) {
            handler();
        }
    },
    stopEditing: function() {
        if(this.inlineEditor) {
            this.inlineEditor.completeEdit();
        }
    },
    addHandler: function() {
        var record = Ext.create(Ext.ClassManager.getName(this.getStore().getProxy().getModel()), Ext.decode(Ext.encode(this.emptyRow)));
        record.set("internalId", this.genAddedId());
        this.stopEditing();
        if (this.rowEditor) {
            this.rowEditor.populate(record, true);
            this.rowEditor.show();
        } else {
            if (this.addAtTop)
                this.getStore().insert(0, [record]);
            else
                this.getStore().add([record]);
            this.updateChangedData(record, "added");
        }
    },
    editHandler: function(record) {
        this.stopEditing();
        // populate row editor
        this.rowEditor.populate(record);
        this.rowEditor.show();
    },
    deleteHandler: function(record) {
        this.stopEditing();
        this.updateChangedData(record, "deleted");
    },
    importHandler: function() {
        if(this.importSettingsWindow == null) {
            this.importSettingsWindow = Ext.create('Ung.ImportSettingsWindow',{
                grid: this
            });
            this.subCmps.push(this.importSettingsWindow);
        }
        this.stopEditing();
        this.importSettingsWindow.show();
    },
    onImport: function (importMode, importedRows) {
        this.stopEditing();
        this.removePagination(Ext.bind(function() {
            Ext.Function.defer(this.onImportContinue, 1, this, [importMode, importedRows]);
        }, this));
    },
    onImportContinue: function (importMode, importedRows) {
        var invalidRecords=0;
        if(importedRows == null) {
            importedRows=[];
        }
        var records=[];
        for (var i = 0; i < importedRows.length; i++) {
            try {
                var record= Ext.create(Ext.ClassManager.getName(this.getStore().getProxy().getModel()), importedRows[i]);
                if(importedRows[i].javaClass == this.recordJavaClass) {
                    record.set("internalId", this.genAddedId());
                    records.push(record);
                } else {
                    invalidRecords++;
                }
            } catch(e) {
                invalidRecords++;
            }
        }
        var validRecords=records.length;
        if(validRecords > 0) {
            if(importMode=='replace' ) {
                this.deleteAllRecords();
                this.getStore().insert(0, records);
                this.updateChangedDataOnImport(records, "added");
            } else {
                if(importMode=='append') {
                    this.getStore().add(records);
                } else if(importMode=='prepend') { //replace or prepend mode
                    this.getStore().insert(0, records);
                }
                this.updateChangedDataOnImport(records, "added");
            }
        }
        if(validRecords > 0) {
            if(invalidRecords==0) {
                Ext.MessageBox.alert(i18n._('Import successful'), Ext.String.format(i18n._("Imported file contains {0} valid records."), validRecords));
            } else {
                Ext.MessageBox.alert(i18n._('Import successful'), Ext.String.format(i18n._("Imported file contains {0} valid records and {1} invalid records."), validRecords, invalidRecords));
            }
        } else {
            if(invalidRecords==0) {
                Ext.MessageBox.alert(i18n._('Warning'), i18n._("Import failed. Imported file has no records."));
            } else {
                Ext.MessageBox.alert(i18n._('Warning'), Ext.String.format(i18n._("Import failed. Imported file contains {0} invalid records and no valid records."), invalidRecords));
            }
        }        
    },
    deleteAllRecords: function () {
        var records=this.getStore().getRange();
        this.updateChangedDataOnImport(records, "deleted");
    },
    exportHandler: function() {
        Ext.MessageBox.wait(i18n._("Exporting Settings..."), i18n._("Please wait"));
        this.removePagination(Ext.bind(function() {
            var gridName=(this.name!=null)?this.name:this.recordJavaClass;
            gridName=gridName.trim().replace(/ /g,"_");
            var exportForm = document.getElementById('exportGridSettings');
            exportForm["gridName"].value=gridName;
            exportForm["gridData"].value="";
            exportForm["gridData"].value=Ext.encode(this.getPageList(true));
            exportForm.submit();
            Ext.MessageBox.hide();
        }, this ));
    },
    removePagination: function (handler) {
        if(this.isPaginated()) {
            //to remove bottom pagination bar
            this.minPaginateCount = Ung.Util.maxRowCount;
            this.setTotalRecords(this.totalRecords);
    
            //make all cahnged data apear in first page
            for (var id in this.changedData) {
                var cd = this.changedData[id];
                cd.page=1;
            }
            //reload grid
            this.getStore().loadPage(1, {
                limit: Ung.Util.maxRowCount,
                callback: handler,
                scope: this
            });
        } else {
            if(handler) {
                handler.call(this);
            }
        }
    },
    genAddedId: function() {
        this.addedId--;
        return this.addedId;
    },
    // is grid paginated
    isPaginated: function() {
        return  this.paginated && (this.totalRecords != null && this.totalRecords >= this.minPaginateCount);
    },
    beforeDestroy: function() {
        Ext.each(this.subCmps, Ext.destroy);
        this.callParent(arguments);
    },
    // load a page
    loadPage: function(page, callback, scope, arg) {
        this.getStore().loadPage(page, {
            limit:this.isPaginated() ? this.recordsPerPage: Ung.Util.maxRowCount,
            callback: callback,
            scope: scope,
            arg: arg
        });
    },
    // when a page is rendered load the changedData for it
    updateFromChangedData: function(store, records) {
        var page = store.currentPage;
        for (var id in this.changedData) {
            var cd = this.changedData[id];
            if (page == cd.page) {
                if ("added" == cd.op) {
                    var record = Ext.create(Ext.ClassManager.getName(store.getProxy().getModel()), cd.recData);
                    store.insert(0, [record]);
                } else if ("modified" == cd.op) {
                    var recIndex = store.findExact("internalId", parseInt(id, 10));
                    if (recIndex >= 0) {
                        var rec = store.getAt(recIndex);
                        rec.data = cd.recData;
                        rec.commit();
                    }
                }
            }
        }
    },
    isDirty: function() {
        // Test if there are changed data
        return this.dirtyFlag || Ung.Util.hasData(this.changedData);
    },
    markDirty: function() {
        this.dirtyFlag=true;
    },
    clearDirty: function() {
        this.changedData = {};
        this.dirtyFlag=false;
        this.getView().setLoading(true);
        //never use defer here because it has unexpected behaviour! 
        this.buildData(Ext.bind(function() {
            this.getStore().loadPage(this.getStore().currentPage, {
                limit:this.isPaginated() ? this.recordsPerPage: Ung.Util.maxRowCount,
                callback: function() {
                    this.getView().setLoading(false);
                },
                scope: this
            });
        }, this));
    },
    reload: function(options) {
        if(options && options.data) {
            this.data = options.data;
        }
        this.clearDirty();
    },
    disableSorting: function () {
        if (!this.sortingDisabled) {
            var cmConfig = this.columns;
            for (var i in cmConfig) {
                cmConfig[i].sortable = false;
            }
            this.sortingDisabled=true;
        }
    },
    // Update Changed data after an import
    updateChangedDataOnImport: function(records, currentOp) {
        this.disableSorting();
        var recLength=records.length;
        var i, record;
        if(currentOp == "added") {
            for (i=0; i < recLength; i++) {
                record=records[i];
                this.changedData[record.get("internalId")] = {
                    op: currentOp,
                    recData: record.data,
                    page: 1
                };
            }
        } else if (currentOp == "deleted") {
            for(i=0; i<recLength; i++) {
                this.getStore().suspendEvents();
                record=records[i];
                var id = record.get("internalId");
                var cd = this.changedData[id];
                if (cd == null) {
                    this.changedData[id] = {
                        op: currentOp,
                        recData: record.data,
                        page: 1
                    };
                } else {
                    if ("added" == cd.op) {
                        this.getStore().remove(record);
                        this.changedData[id] = null;
                        delete this.changedData[id];
                    } else {
                        this.changedData[id] = {
                            op: currentOp,
                            recData: record.data,
                            page: 1
                        };
                    }                    
                }
                this.getStore().resumeEvents();
            }
            if(records.length > 0) {
                this.getView().refresh(false);
            }
        }
    },
    // Update Changed data after an operation (modifyed, deleted, added)
    updateChangedData: function(record, currentOp) {
        this.disableSorting();
        var id = record.get("internalId");
        var cd = this.changedData[id];
        var index;
        if (cd == null) {
            this.changedData[id] = {
                op: currentOp,
                recData: record.data,
                page: this.getStore().currentPage
            };
            if ("deleted" == currentOp) {
                index = this.getStore().indexOf(record);
                this.getView().refreshNode(index);
            }
        } else {
            if ("deleted" == currentOp) {
                if ("added" == cd.op) {
                    this.getStore().remove(record);
                    this.changedData[id] = null;
                    delete this.changedData[id];
                } else {
                    this.changedData[id] = {
                        op: currentOp,
                        recData: record.data,
                        page: this.getStore().currentPage
                    };
                    index = this.getStore().indexOf(record);
                    this.getView().refreshNode(index);
                }
            } else {
                if ("added" == cd.op) {
                    this.changedData[id].recData = record.data;
                } else {
                    this.changedData[id] = {
                        op: currentOp,
                        recData: record.data,
                        page: this.getStore().currentPage
                    };
                }
            }
        }
    },
    // Set the total number of records
    setTotalRecords: function(totalRecords) {
        this.totalRecords = totalRecords;
        if(this.paginated) {
            var isPaginated=this.isPaginated();
            this.getStore().pageSize=isPaginated?this.recordsPerPage:Ung.Util.maxRowCount;
            if(!isPaginated) {
                //Needs to set currentPage to 1 when not using pagination toolbar.
                this.getStore().currentPage=1;
            }
            var bbar=this.getDockedItems('toolbar[dock="bottom"]')[0];
            //Had to disable show/hide pagination feature for grids inside a window for Chrome browser because of the right scrollbar incorrect rendering issue. 
            //Fixing this is more important than hiding the unnecesary pagination toolbar 
            if(Ext.isChrome && this.up().xtype=="window") {
                if (isPaginated) {
                    bbar.enable();
                } else {
                    bbar.disable();
                }
            } else {
                if (isPaginated) {
                    bbar.show();
                    bbar.enable();
                } else {
                    bbar.hide();
                    bbar.disable();
                }
                if(this.rendered) {
                    this.setSize();
                }
            }
        }
    },
    setRowEditor: function(rowEditor) {
        this.rowEditor = rowEditor;
        this.rowEditor.grid=this;
        this.subCmps.push(this.rowEditor);
    },
    findFirstChangedDataByFieldValue: function(field, value) {
        for (var id in this.changedData) {
            var cd = this.changedData[id];
            if (cd.op != "deleted" && cd.recData[field] == value) {
                return cd;
            }
        }
        return null;
    },

    focusChangedDataField: function(cd, field) {
        var recIndex = this.getStore().findExact("internalId", parseInt(cd.recData["internalId"], 10));
        if (recIndex >= 0) {
            this.getView().focusRow(recIndex);
        }
    },
    // focus the first changed row matching a field value
    // used by validation functions
    focusFirstChangedDataByFieldValue: function(field, value) {
        var cd = this.findFirstChangedDataByFieldValue(field, value);
        if (cd != null) {
            this.getStore().loadPage(cd.page,{
                callback:Ext.bind(function(r, options, success) {
                    if (success) {
                        this.focusChangedDataField(options.arg, field);
                    }
                }, this),
                scope: this,
                arg: cd
            });
        }
    },
    getAddedDeletedModifiedLists: function() {
        var added = [];
        var deleted = [];
        var modified = [];
        for (var id in this.changedData) {
          var cd = this.changedData[id];
          if ("deleted" == cd.op) {
            if (id > 0) {
              deleted.push(parseInt(id, 10));
              }
          } else {
            if (this.recordJavaClass != null) {
              cd.recData["javaClass"] = this.recordJavaClass;
            }
            if (id < 0) {
              added.push(cd.recData);
            } else {
              modified.push(cd.recData);
            }
          }
        }
        return [{
            list: added,
            "javaClass": "java.util.ArrayList"
        }, {
            list: deleted,
            "javaClass": "java.util.ArrayList"
        }, {
            list: modified,
            "javaClass": "java.util.ArrayList"
        }];
    },
    // Get the page list
    // for the unpaginated grids, that send all the records on save
    //Attention this only gets the records from the current page!
    //It can't be used for grids that may have pagination.
    //Can be used only for grids that have explicitly set: paginated: false
    getPageList: function(useId, useInternalId) {
        var list=[];
        if(!this.dataLoaded) {
            //This code should never be called
            if(!this.dataInitialized) {
                this.getData();
            }
            //NOT Working fine with mapping fields
            this.getStore().loadData(this.data);
            this.dataLoaded=true;
        }
        var records=this.getStore().getRange();
        for(var i=0; i<records.length;i++) {
            var id = records[i].get("internalId");
            if (id != null && id >= 0) {
                var d = this.changedData[id];
                if (d) {
                    if (d.op == "deleted") {
                        continue;
                    }
                }
            }
            if (this.recordJavaClass != null) {
                records[i].data["javaClass"] = this.recordJavaClass;
            }
            var recData=Ext.decode(Ext.encode(records[i].data));
            if(!useInternalId) {
                delete recData["internalId"];
            }
            if(!useId) {
                delete recData["id"];
            } else if(!this.useServerIds) {
                recData["id"]=i+1;
            }

            list.push(recData);
        }            
        return list;
    },
    // Get the entire list from all pages, and the result is returned in the callback handler function.
    // This is why it cannot be used synchronusly. it have to be used in an async way.
    // First it remove pagination the grid then it gets the list
    getList: function(handler, skipRepagination) {
        if(this.isPaginated()) {
            var oldSettings=null;
            if(!skipRepagination) {
                oldSettings = {
                    changedData: Ext.decode(Ext.encode(this.changedData)),
                    minPaginateCount: this.minPaginateCount,
                    page: this.getStore().currentPage
                };
            }
            //to remove bottom pagination bar
            this.minPaginateCount = Ung.Util.maxRowCount;
            if(skipRepagination) {
                this.setTotalRecords(this.totalRecords);
            }
    
            //make all cahnged data apear in first page
            for (var id in this.changedData) {
                var cd = this.changedData[id];
                cd.page=1;
            }
            //reload grid
            this.getStore().loadPage(1, {
                limit:Ung.Util.maxRowCount,
                callback: Ext.bind(function() {
                    var result=this.getPageList();
                    if(!skipRepagination) {
                        this.changedData = oldSettings.changedData;
                        this.minPaginateCount = oldSettings.minPaginateCount;
                        this.getStore().loadPage(oldSettings.page, {
                            limit:this.isPaginated() ? this.recordsPerPage: Ung.Util.maxRowCount,
                                callback:Ext.bind(function() {
                                handler({
                                    javaClass: "java.util.LinkedList",
                                    list: result
                                });
                            }, this),
                            scope: this
                        });
                    } else {
                        handler({
                            javaClass: "java.util.LinkedList",
                            list: result
                        });
                    }
                }, this),
                scope: this
            });
        } else {
            var saveList = this.getPageList();
            handler({
                javaClass: "java.util.LinkedList",
                list: saveList
            });
        }
    },
    //Trying to create a function to get data from all pages in one line without the need of the callback function as parameter
    //This is not working as expected so it should not be used. may stay here for future development
/*
    _getGridData: function() {
        var data=null;
        if(this.isPaginated()) {
            var oldSettings = {
                changedData: Ext.clone(this.changedData),
                page: this.getStore().currentPage
            };
            //make all cahnged data apear in first page
            for (id in this.changedData) {
                var cd = this.changedData[id];
                cd.page=1;
            }
            //reload grid
            this.getStore().loadPage(1, {
                limit: Ung.Util.maxRowCount
            });
            data=this.getPageList();
            this.changedData = oldSettings.changedData;
            //reload grid context
            this.getStore().loadPage(oldSettings.page, {
                limit: this.isPaginated() ? this.recordsPerPage: Ung.Util.maxRowCount
            });
        } else {
            data=this.getPageList();  
        }
        return {
            javaClass: "java.util.LinkedList",
            list: data
        };
    },
*/    
    getDeletedList: function() {
        var list=[];
        var records=this.getStore().getRange();
        for(var i=0; i<records.length;i++) {
            var id = records[i].get("internalId");
            if (id != null && id >= 0) {
                var d = this.changedData[id];
                if (d) {
                    if (d.op == "deleted") {
                        if (this.recordJavaClass != null) {
                            records[i].data["javaClass"] = this.recordJavaClass;
                        }
                        list.push(records[i].data);
                    }
                }
            }
        }
        return list;
    }
});

// Navigation Breadcrumbs
Ext.define('Ung.Breadcrumbs', {
    extend:'Ext.Component',
    autoEl: "div",
    // ---Node specific attributes------
    elements: null,
    afterRender: function() {
        this.callParent(arguments);
        if (this.elements != null) {
            for (var i = 0; i < this.elements.length; i++) {
                if (i > 0) {
                    this.getEl().insertHtml('beforeEnd', '<span class="icon-breadcrumbs-separator">&nbsp;&nbsp;&nbsp;&nbsp;</span>');
                }
                var crumb = this.elements[i];
                if (crumb.action) {
                    var crumbEl = document.createElement("span");
                    crumbEl.className = 'breadcrumb-link';
                    crumbEl.innerHTML = crumb.title;
                    crumbEl = Ext.get(crumbEl);
                    crumbEl.on("click", crumb.action, this);
                    this.getEl().appendChild(crumbEl);

                } else {
                    this.getEl().insertHtml('beforeEnd', '<span class="breadcrumb-text" >' + crumb.title + '</span>');
                }
            }
        }
    }
});

Ung.grid.ButtonColumn = function(config) {
    Ext.apply(this, config);
    if (!this.id) {
        this.id = Ext.id();
    }
    if (!this.width) {
        this.width = 80;
    }
    if (this.resizable == null) {
        this.resizable = false;
    }
    if (this.sortable == null) {
        this.sortable = false;
    }
    if (!this.dataIndex) {
        this.dataIndex = null;
    }
    this.renderer = Ext.bind(this.renderer, this);
};

Ung.grid.ButtonColumn.prototype = {
    init: function(grid) {
        this.grid = grid;
        this.grid.on('afterrender', function() {
            var view = this.grid.getView();
            view.mainBody.on('mousedown', this.onMouseDown, this);
            view.mainBody.on('mouseover', this.onMouseOver, this);
            view.mainBody.on('mouseout', this.onMouseOut, this);
        }, this);
    },

    onMouseDown: function(e, t) {
        if (t.className && t.className.indexOf('ung-button') != -1) {
            e.stopEvent();
            var index = this.grid.getView().findRowIndex(t);
            var record = this.grid.getStore().getAt(index);
            this.handle(record);
        }
    },
    // to override
    handle: function(record) {
    },
    // private
    onMouseOver: function(e,t) {
        if (t.className && t.className.indexOf('ung-button') != -1) {
            t.className="ung-button button-column ung-button-hover";
        }
    },
    // private
    onMouseOut: function(e,t) {
        if (t.className && t.className.indexOf('ung-button') != -1) {
            t.className="ung-button button-column";
        }
    },
    renderer: function(value, metadata, record) {
        return '<div class="ung-button button-column">'+value+'</div>';
    }
};

//Import Settings window
Ext.define('Ung.ImportSettingsWindow', {
    extend:'Ung.UpdateWindow',
    // the editor grid
    grid: null,
    height: 230,
    width: 500,
    sizeToRack: false,
    // size to grid on show
    sizeToGrid: false,
    //importMode
    // 'replace' = 'Replace current settings'
    // 'prepend' = 'Prepend to current settings'
    // 'append' = 'Append to current settings'
    importMode: 'replace',     
    initComponent: function() {
        if (!this.height && !this.width) {
            this.sizeToGrid = true;
        }
        if (this.title == null) {
            this.title = i18n._('Import Settings');
        }
        if(this.bbar == null) {
            this.bbar  = [
                '->',
                {
                    name: "Cancel",
                    id: this.getId() + "_cancelBtn",
                    iconCls: 'cancel-icon',
                    text: i18n._('Cancel'),
                    handler: Ext.bind(function() {
                        this.cancelAction();
                    }, this)
                },'-',{
                    name: "Done",
                    id: this.getId() + "_doneBtn",
                    iconCls: 'apply-icon',
                    text: i18n._('Done'),
                    handler: Ext.bind(function() {
                        Ext.getCmp('import_settings_form'+this.getId()).getForm().submit({
                            waitMsg: i18n._('Please wait while the settings are uploaded...'),
                            success: Ext.bind(this.importSettingsSuccess, this ),
                            failure: Ext.bind(this.importSettingsFailure, this )
                        });
                    }, this)
            },'-'];         
        }
        this.items = Ext.create('Ext.panel.Panel',{
            anchor: "100% 100%",
            buttonAlign: 'right',
            border: false,
            bodyStyle: 'padding:10px 10px 0px 10px;',
            autoScroll: true,
            defaults: {
                selectOnFocus: true,
                msgTarget: 'side'
            },
            items: [{
                xtype: 'radio',
                boxLabel: i18n._('Replace current settings'),
                hideLabel: true,
                name: 'importMode',
                checked: (this.importMode=='replace'),
                listeners: {
                    "change": {
                        fn: Ext.bind(function(elem, checked) {
                            if(checked) {
                                this.importMode = 'replace';
                            }
                        }, this)
                    }
                }
            }, {
                xtype: 'radio',
                boxLabel: i18n._('Prepend to current settings'),
                hideLabel: true,
                name: 'importMode',
                checked: (this.importMode=='prepend'),
                listeners: {
                    "change": {
                        fn: Ext.bind(function(elem, checked) {
                            if(checked) {
                                this.importMode = 'prepend';
                            }
                        }, this)
                    }
                }
            }, {
                xtype: 'radio',
                boxLabel: i18n._('Append to current settings'),
                hideLabel: true,
                name: 'importMode',
                checked: (this.importMode=='append'),
                listeners: {
                    "change": {
                        fn: Ext.bind(function(elem, checked) {
                            if(checked) {
                                this.importMode = 'append';
                            }
                        }, this)
                    }
                }
            }, {
                cls: 'description',
                border: false,
                bodyStyle: 'padding:5px 0px 5px 30px;',
                html: "<i>" + i18n._("with settings from")+ "</i>"
            }, {
                xtype: 'form',
                id: 'import_settings_form'+this.getId(),
                url: 'gridSettings',
                border: false,
                items: [{
                    xtype: 'filefield',
                    fieldLabel: i18n._('File'),
                    name: 'import_settings_textfield',
                    width: 450,
                    size: 45,
                    labelWidth: 50,
                    allowBlank: false
                },{
                    xtype: 'hidden',
                    name: 'type',
                    value: 'import'
                }]
            }]
        });
        this.callParent(arguments);
    },
    show: function() {
        Ung.UpdateWindow.superclass.show.call(this);
        var objPosition = this.grid.getPosition();
        if (this.sizeToGrid) {
            var objSize = this.grid.getSize();
            this.setSize(objSize);
            if (objPosition[1] + objSize.height > main.viewport.getSize().height) {
                objPosition[1] = Math.max(main.viewport.getSize().height - objSize.height,0);
            }
        }
        this.setPosition(objPosition);
    },
    importSettingsSuccess: function (form, action) {
        var result = action.result;
        Ext.MessageBox.wait(i18n._("Importing Settings..."), i18n._("Please wait"));
        if(!result) {
            Ext.MessageBox.alert(i18n._("Warning"), i18n._("Import failed."));
        } else if(!result.success) {
            Ext.MessageBox.alert(i18n._("Warning"), result.msg);
        } else {
            this.grid.onImport(this.importMode, result.msg);
            this.closeWindow();
        }
    },
    importSettingsFailure: function (form, action) {
        var result = action.result;
        if(!result) {
            Ext.MessageBox.alert(i18n._("Warning"), i18n._("Import failed. No file chosen."));
        } else {
            Ext.MessageBox.alert(i18n._("Warning"), action.result.msg);
        }
    },
    isDirty: function() {
        return false;  
    },
    closeWindow: function() {
        this.hide();
    }
});

// Base matcher pop-up editor window
Ext.define('Ung.MatcherEditorWindow', {
    extend:'Ung.EditWindow',
    height: 210,
    width: 120,
    inputLines: null, //override me
    initComponent: function() {
        if (this.title == null) {
            this.title = i18n._('Edit');
        }
        this.items = Ext.create('Ext.panel.Panel',{
            anchor: "100% 100%",
            labelWidth: 100,
            buttonAlign: 'right',
            border: false,
            bodyStyle: 'padding:10px 10px 0px 10px;',
            autoScroll: true,
            defaults: {
                selectOnFocus: true,
                msgTarget: 'side'
            },
            items: this.inputLines
        });
        this.callParent(arguments);
    },
    onShow: function() {
        Ung.Window.superclass.onShow.call(this);
        this.setSize({width:this.width,height:this.height});
    },
    populate: function(record, value, rulebuilder) {
        this.record = record;
        this.rulebuilder = rulebuilder;
        this.setValue(value);
    },
    updateAction: function() {
        this.record.set("value", this.getValue());
        this.rulebuilder.dirtyFlag = true;
        this.rulebuilder.fireEvent("afteredit");
        this.hide();
    },
    cancelAction: function() {
        this.hide();
    },
    // set the value of fields (override me)
    setValue: function(value) {
        Ung.Util.todo();
    },
    // set the record based on the value of the fields (override me)
    getValue: function() {
        Ung.Util.todo();
    }
});

// matcher pop-up editor for time ranges
Ext.define('Ung.TimeEditorWindow', {
    extend:'Ung.MatcherEditorWindow',
    height: 250,
    width: 300,
    initComponent: function() {
        this.inputLines = [{
            xtype: 'radio',
            name: 'timeMethod',
            id: 'time_method_range_'+this.getId(),
            boxLabel: i18n._('Specify a Range'),
            listeners: {
                "change": {
                    fn: Ext.bind(function(elem, checked) {
                        if (checked) {
                            Ext.getCmp('start_time_hour_'+this.getId()).enable();
                            Ext.getCmp('start_time_minute_'+this.getId()).enable();
                            Ext.getCmp('end_time_hour_'+this.getId()).enable();
                            Ext.getCmp('end_time_minute_'+this.getId()).enable();
                            Ext.getCmp('time_custom_value_'+this.getId()).disable();
                        } else {
                            Ext.getCmp('start_time_hour_'+this.getId()).disable();
                            Ext.getCmp('start_time_minute_'+this.getId()).disable();
                            Ext.getCmp('end_time_hour_'+this.getId()).disable();
                            Ext.getCmp('end_time_minute_'+this.getId()).disable();
                            Ext.getCmp('time_custom_value_'+this.getId()).enable();
                        }
                    }, this)
                }
            }
        }, {
            xtype:'fieldset',
            name: 'Start Time',
            title: i18n._("Start Time"),
            fieldLabel: i18n._("Start Time - End Time"),
            layout: {
                type: 'table',
                columns: 7
            },
            items: [{
                xtype: 'combo',
                id: 'start_time_hour_'+this.getId(),
                editable: false,
                width: 40,
                allowBlank: false,
                store: [["00","00"], ["01","01"], ["02","02"], ["03","03"], ["04","04"], ["05","05"], ["06","06"], ["07","07"], ["08","08"], ["09","09"],
                        ["10","10"], ["11","11"], ["12","12"], ["13","13"], ["14","14"], ["15","15"], ["16","16"], ["17","17"], ["18","18"], ["19","19"],
                        ["20","20"], ["21","21"], ["22","22"], ["23","23"]]
            }, {
                cls: 'description',
                border: false,
                html: "&nbsp;:&nbsp;"
            }, {
                xtype: 'combo',
                id: 'start_time_minute_'+this.getId(),
                editable: false,
                width: 40,
                allowBlank: false,
                store: [["00","00"], ["01","01"], ["02","02"], ["03","03"], ["04","04"], ["05","05"], ["06","06"], ["07","07"], ["08","08"], ["09","09"],
                        ["10","10"], ["11","11"], ["12","12"], ["13","13"], ["14","14"], ["15","15"], ["16","16"], ["17","17"], ["18","18"], ["19","19"],
                        ["20","20"], ["21","21"], ["22","22"], ["23","23"], ["24","24"], ["25","25"], ["26","26"], ["27","27"], ["28","28"], ["29","29"],
                        ["30","30"], ["31","31"], ["32","32"], ["33","33"], ["34","34"], ["35","35"], ["36","36"], ["37","37"], ["38","38"], ["39","39"],
                        ["40","40"], ["41","41"], ["42","42"], ["43","43"], ["44","44"], ["45","45"], ["46","46"], ["47","47"], ["48","48"], ["49","49"],
                        ["50","50"], ["51","51"], ["52","52"], ["53","53"], ["54","54"], ["55","55"], ["56","56"], ["57","57"], ["58","58"], ["59","59"]]
            }, {
                cls: 'description',
                border: false,
                html: "&nbsp;" + i18n._("to") + "&nbsp;"
            }, {
                xtype: 'combo',
                id: 'end_time_hour_'+this.getId(),
                editable: false,
                width: 40,
                allowBlank: false,
                store: [["00","00"], ["01","01"], ["02","02"], ["03","03"], ["04","04"], ["05","05"], ["06","06"], ["07","07"], ["08","08"], ["09","09"],
                        ["10","10"], ["11","11"], ["12","12"], ["13","13"], ["14","14"], ["15","15"], ["16","16"], ["17","17"], ["18","18"], ["19","19"],
                        ["20","20"], ["21","21"], ["22","22"], ["23","23"]]
            }, {
                cls: 'description',
                border: false,
                html: "&nbsp;:&nbsp;"
            }, {
                xtype: 'combo',
                id: 'end_time_minute_'+this.getId(),
                editable: false,
                width: 40,
                allowBlank: false,
                store: [["00","00"], ["01","01"], ["02","02"], ["03","03"], ["04","04"], ["05","05"], ["06","06"], ["07","07"], ["08","08"], ["09","09"],
                        ["10","10"], ["11","11"], ["12","12"], ["13","13"], ["14","14"], ["15","15"], ["16","16"], ["17","17"], ["18","18"], ["19","19"],
                        ["20","20"], ["21","21"], ["22","22"], ["23","23"], ["24","24"], ["25","25"], ["26","26"], ["27","27"], ["28","28"], ["29","29"],
                        ["30","30"], ["31","31"], ["32","32"], ["33","33"], ["34","34"], ["35","35"], ["36","36"], ["37","37"], ["38","38"], ["39","39"],
                        ["40","40"], ["41","41"], ["42","42"], ["43","43"], ["44","44"], ["45","45"], ["46","46"], ["47","47"], ["48","48"], ["49","49"],
                        ["50","50"], ["51","51"], ["52","52"], ["53","53"], ["54","54"], ["55","55"], ["56","56"], ["57","57"], ["58","58"], ["59","59"]]
            }]
        }, {
            xtype: 'radio',
            name: 'timeMethod',
            id: 'time_method_custom_'+this.getId(),
            boxLabel: i18n._('Specify a Custom Value'),
            listeners: {
                "change": {
                    fn: Ext.bind(function(elem, checked) {
                        if (!checked) {
                            Ext.getCmp('start_time_hour_'+this.getId()).enable();
                            Ext.getCmp('start_time_minute_'+this.getId()).enable();
                            Ext.getCmp('end_time_hour_'+this.getId()).enable();
                            Ext.getCmp('end_time_minute_'+this.getId()).enable();
                            Ext.getCmp('time_custom_value_'+this.getId()).disable();
                        } else {
                            Ext.getCmp('start_time_hour_'+this.getId()).disable();
                            Ext.getCmp('start_time_minute_'+this.getId()).disable();
                            Ext.getCmp('end_time_hour_'+this.getId()).disable();
                            Ext.getCmp('end_time_minute_'+this.getId()).disable();
                            Ext.getCmp('time_custom_value_'+this.getId()).enable();
                        }
                    }, this)
                }
            }
        }, {
            xtype:'textfield',
            id: 'time_custom_value_'+this.getId(),
            width: 250,
            allowBlank:false
        }];
        this.callParent(arguments);
    },
    setValue: function(value) {
        var time_method_custom = Ext.getCmp('time_method_custom_'+this.getId());
        var time_method_range = Ext.getCmp('time_method_range_'+this.getId());
        var start_time_hour = Ext.getCmp('start_time_hour_'+this.getId());
        var start_time_minute = Ext.getCmp('start_time_minute_'+this.getId());
        var end_time_hour = Ext.getCmp('end_time_hour_'+this.getId());
        var end_time_minute = Ext.getCmp('end_time_minute_'+this.getId());
        var time_custom_value = Ext.getCmp('time_custom_value_'+this.getId());
        start_time_hour.setValue(12);
        start_time_minute.setValue(0);
        end_time_hour.setValue(13);
        end_time_minute.setValue(30);
        time_method_custom.setValue(true);
        time_custom_value.setValue(value);

        /* if no value is specified - default to range with default range */
        if (value == "") {
            time_method_range.setValue(true);
            return;
        }
        
        var record_value = value;
        if (record_value == null)
            return;
        if (record_value.indexOf(",") != -1)
            return;
        var splits = record_value.split("-");
        if (splits.length != 2)
            return;

        var start_time = splits[0].split(":");
        var end_time = splits[1].split(":");

        if (start_time.length != 2)
            return;
        if (end_time.length != 2)
            return;

        start_time_hour.setValue(start_time[0]);
        start_time_minute.setValue(start_time[1]);
        end_time_hour.setValue(end_time[0]);
        end_time_minute.setValue(end_time[1]);
        time_method_range.setValue(true);
    },
    getValue: function() {
        var time_method_custom = Ext.getCmp('time_method_custom_'+this.getId());
        if (time_method_custom.getValue()) {
            var time_custom_value = Ext.getCmp('time_custom_value_'+this.getId());
            return time_custom_value.getValue();
        } else {
            var start_time_hour = Ext.getCmp('start_time_hour_'+this.getId());
            var start_time_minute = Ext.getCmp('start_time_minute_'+this.getId());
            var end_time_hour = Ext.getCmp('end_time_hour_'+this.getId());
            var end_time_minute = Ext.getCmp('end_time_minute_'+this.getId());
            return start_time_hour.getValue() + ":" + start_time_minute.getValue() + "-" + end_time_hour.getValue() + ":" + end_time_minute.getValue();
        }
    }
});

// matcher pop-up editor for time users
Ext.define('Ung.UserEditorWindow', {
    extend:'Ung.MatcherEditorWindow',
    height: 450,
    width: 550,
    initComponent: function() {
        var data = [];
        this.gridPanel = Ext.create('Ext.grid.Panel', {
            title: i18n._('Users'),
            id: 'usersGrid_'+this.getId(),
            height: 300,
            width: 400,
            enableColumnHide: false,
            enableColumnMove: false,
            store: new Ext.data.Store({
                data: data,
                sortOnLoad: true,
                sorters: { property: 'uid', direction : 'ASC' },
                fields: [{
                    name: "lastName"
                },{
                    name: "firstName"
                },{
                    name: "checked"
                },{
                    name: "uid"
                },{
                    name: "displayName",
                    convert: function(val, rec) {
                        if (val != null && val != "")
                            return val;
                        var displayName = ( rec.data.firstName == null )  ? "": rec.data.firstName;
                        displayName = displayName + " " + (( rec.data.lastName == null )  ? "": rec.data.lastName);
                        return displayName;
                    }
                }]
            }),
            columns: [ {
                header: i18n._("Selected"),
                width: 60,
                xtype:'checkcolumn',
                menuDisabled: true,
                sortable: false,
                dataIndex: "checked"
            }, {
                header: i18n._("Name"),
                width: 100,
                sortable: true,
                menuDisabled: true,
                dataIndex: "uid"
            },{
                header: i18n._("Full Name"),
                width: 200,
                sortable: true,
                menuDisabled: true,
                dataIndex: "displayName"
            }]
        });

        this.inputLines = [{
            xtype: 'radio',
            name: 'userMethod',
            boxLabel: i18n._('Specify Users'),
            listeners: {
                "change": {
                    fn: Ext.bind(function(elem, checked) {
                        if (checked) {
                            Ext.getCmp('usersGrid_'+this.getId()).enable();
                            Ext.getCmp('user_custom_value_'+this.getId()).disable();
                        } else {
                            Ext.getCmp('usersGrid_'+this.getId()).disable();
                            Ext.getCmp('user_custom_value_'+this.getId()).enable();
                        }
                    }, this)
                }
            }
        }, this.gridPanel, {
            xtype: 'radio',
            name: 'userMethod',
            id: 'user_method_custom_'+this.getId(),
            boxLabel: i18n._('Specify a Custom Value'),
            listeners: {
                "change": {
                    fn: Ext.bind(function(elem, checked) {
                        if (!checked) {
                            Ext.getCmp('usersGrid_'+this.getId()).enable();
                            Ext.getCmp('user_custom_value_'+this.getId()).disable();
                        } else {
                            Ext.getCmp('usersGrid_'+this.getId()).disable();
                            Ext.getCmp('user_custom_value_'+this.getId()).enable();
                        }
                    }, this)
                }
            }
        }, {
            xtype:'textfield',
            id: 'user_custom_value_'+this.getId(),
            width: 250,
            allowBlank:false
        }];
        
        this.callParent(arguments);
    },
    populate: function(record, value, rulebuilder) {
        var data = [];
        var node;
        try {
            node = rpc.nodeManager.node("untangle-node-adconnector");
        } catch (e) {
            Ung.Util.rpcExHandler(e);
        }
        if (node != null) {
            Ext.MessageBox.wait(i18n._("Loading..."), i18n._("Please wait"));
            data = node.getUserEntries().list;
            Ext.MessageBox.hide();
        } else {
            data.push({ firstName: "", lastName: null, uid: "[any]", displayName: "Any User"});
            data.push({ firstName: "", lastName: null, uid: "[authenticated]", displayName: "Any Authenticated User"});
            data.push({ firstName: "", lastName: null, uid: "[unauthenticated]", displayName: "Any Unauthenticated/Unidentified User"});
        }

        this.gridPanel.getStore().getProxy().data = data;
        this.gridPanel.getStore().load();
        this.callParent(arguments);
    },
    setValue: function(value) {
        var user_method_custom = Ext.getCmp('user_method_custom_'+this.getId());
        var user_custom_value = Ext.getCmp('user_custom_value_'+this.getId());

        this.gridPanel.getStore().load();
        
        user_method_custom.setValue(true);
        user_custom_value.setValue(value);
    },
    getValue: function() {
        var user_method_custom = Ext.getCmp('user_method_custom_'+this.getId());
        if (user_method_custom.getValue()) {
            var user_custom_value = Ext.getCmp('user_custom_value_'+this.getId());
            return user_custom_value.getValue();
        } else{
            var str = "";
            var first = true;
            for ( var i = 0 ; i < this.gridPanel.store.data.items.length ; i++ ) {
                var row = this.gridPanel.store.data.items[i].data;
                if (row.checked) {
                    if (row.uid == "[any]")
                        return "[any]"; /* if any is checked, the rest is irrelevent */
                    if (!first)
                        str = str + ",";
                    else
                        first = false;
                    str = str + row.uid;
                }
            }
            return str;
        }
    }
});

// matcher pop-up editor for time groups
Ext.define('Ung.GroupEditorWindow', {
    extend:'Ung.MatcherEditorWindow',
    height: 450,
    width: 550,
    initComponent: function() {
        var data = [];
        
        this.gridPanel = Ext.create('Ext.grid.Panel', {
            title: i18n._('Groups'),
            id: 'groupsGrid_'+this.getId(),
            height: 300,
            width: 400,
            enableColumnHide: false,
            enableColumnMove: false,
            store: new Ext.data.Store({
                data: data,
                sortOnLoad: true,
                sorters: { property: 'SAMAccountName', direction : 'ASC' },
                fields: [{
                    name: "checked"
                },{
                    name: "CN"
                },{
                    name: "SAMAccountName"
                },{
                    name: "displayName",
                    convert: function(val, rec) {
                        if (val != null && val != "")
                            return val;
                        return rec.data.CN;
                    }
                }]
            }),
            columns: [ {
                header: i18n._("Selected"),
                width: 60,
                menuDisabled: true,
                sortable: false,
                xtype:'checkcolumn',
                dataIndex: "checked"
            }, {
                header: i18n._("Name"),
                width: 100,
                menuDisabled: true,
                sortable: true,
                dataIndex: "SAMAccountName"
            },{
                header: i18n._("Full Name"),
                width: 200,
                menuDisabled: true,
                sortable: true,
                dataIndex: "displayName"
            }]
        });

        this.inputLines = [{
            xtype: 'radio',
            name: 'groupMethod',
            boxLabel: i18n._('Specify Groups'),
            listeners: {
                "change": {
                    fn: Ext.bind(function(elem, checked) {
                        if (checked) {
                            Ext.getCmp('groupsGrid_'+this.getId()).enable();
                            Ext.getCmp('group_custom_value_'+this.getId()).disable();
                        } else {
                            Ext.getCmp('groupsGrid_'+this.getId()).disable();
                            Ext.getCmp('group_custom_value').enable();
                        }
                    }, this)
                }
            }
        }, this.gridPanel, {
            xtype: 'radio',
            name: 'groupMethod',
            id: 'group_method_custom_'+this.getId(),
            boxLabel: i18n._('Specify a Custom Value'),
            listeners: {
                "change": {
                    fn: Ext.bind(function(elem, checked) {
                        if (!checked) {
                            Ext.getCmp('groupsGrid_'+this.getId()).enable();
                            Ext.getCmp('group_custom_value_'+this.getId()).disable();
                        } else {
                            Ext.getCmp('groupsGrid_'+this.getId()).disable();
                            Ext.getCmp('group_custom_value_'+this.getId()).enable();
                        }
                    }, this)
                }
            }
        }, {
            xtype:'textfield',
            id: 'group_custom_value_'+this.getId(),
            width: 250,
            allowBlank:false
        }];
        
        this.callParent(arguments);
    },
    populate: function(record, value, rulebuilder) {
        var data = [];
        var node;
        try {
            node = rpc.nodeManager.node("untangle-node-adconnector");
        } catch (e) {
            Ung.Util.rpcExHandler(e);
        }
        if (node != null) {
            Ext.MessageBox.wait(i18n._("Loading..."), i18n._("Please wait"));
            data = node.getGroupEntries().list;
            Ext.MessageBox.hide();
        } else {
            data.push({ SAMAccountName: "*", displayName: "Any Group"});
        }

        this.gridPanel.getStore().getProxy().data = data;
        this.gridPanel.getStore().load();
        this.callParent(arguments);
    },
    setValue: function(value) {
        var group_method_custom = Ext.getCmp('group_method_custom_'+this.getId());
        var group_custom_value = Ext.getCmp('group_custom_value_'+this.getId());

        this.gridPanel.getStore().load();
        
        group_method_custom.setValue(true);
        group_custom_value.setValue(value);
    },
    getValue: function() {
        var group_method_custom = Ext.getCmp('group_method_custom_'+this.getId());
        if (group_method_custom.getValue()) {
            var group_custom_value = Ext.getCmp('group_custom_value_'+this.getId());
            return group_custom_value.getValue();
        } else{
            var str = "";
            var first = true;
            for ( var i = 0 ; i < this.gridPanel.store.data.items.length ; i++ ) {
                var row = this.gridPanel.store.data.items[i].data;
                if (row.checked) {
                    if (row.SAMAccountName == "*")
                        return "*"; /* if any is checked, the rest is irrelevent */
                    if (!first)
                        str = str + ",";
                    else
                        first = false;
                    str = str + row.SAMAccountName;
                }
            }
            return str;
        }
    }
});

//RuleBuilder
Ext.define('Ung.RuleBuilder', {
    extend: 'Ext.grid.Panel',
    settingsCmp: null,
    enableColumnHide: false,
    enableColumnMove: false,
    dirtyFlag: false,
    alias: 'widget.rulebuilder',
    javaClass: null,

    initComponent: function() {
        Ext.applyIf(this, {
            height: 220,
            anchor: "100%"
        });
        this.selModel= Ext.create('Ext.selection.Model',{});
        this.tbar = [{
            iconCls: 'icon-add-row',
            text: this.settingsCmp.i18n._("Add"),
            handler: this.addHandler,
            scope: this
        }];
        
        this.modelName='Ung.RuleBuilder.Model-' + this.id;
        if ( Ext.ModelManager.get(this.modelName) == null) {
            Ext.define(this.modelName, {
                extend: 'Ext.data.Model',
                requires: ['Ext.data.SequentialIdGenerator'],
                idgen: 'sequential',
                fields: [{name: 'name'},{name: 'invert'},{name: 'value'},{name:'vtype'}]
            });
        }
        this.store = Ext.create('Ext.data.Store', { model:this.modelName});
        this.matchersMap=Ung.Util.createRecordsMap(this.matchers, 'name');
      
        this.recordDefaults={name:"", value:"", vtype:""};
        var deleteColumn = Ext.create('Ung.grid.DeleteColumn',{});
        this.plugins=[deleteColumn];
        this.columns=[{
            align: "center", 
            header: "",
            width: 45,
            resizable: false,
            menuDisabled: true,
            dataIndex: null,
            renderer: Ext.bind(function(value, metadata, record, rowIndex) {
                if (rowIndex == 0) return "";
                return this.settingsCmp.i18n._("and");
            }, this)
        },{
            header: this.settingsCmp.i18n._("Type"),
            width: 250,
            sortable: false,
            menuDisabled: true,
            dataIndex: "name",
            renderer: Ext.bind(function(value, metadata, record, rowIndex, colIndex, store) {
                var out=[];
                out.push('<select class="rule_builder_type" onchange="Ext.getCmp(\''+this.getId()+'\').changeRowType(\''+record.getId()+'\', this)">');
                out.push('<option value=""></option>');

                for (var i = 0; i < this.matchers.length; i++) {
                    var selected = this.matchers[i].name == value;
                    var seleStr=(selected)?"selected":"";
                    // if this select is invisible and not already selected (dont show it)
                    // if it is selected and invisible, show it (we dont have a choice)
                    if (!this.matchers[i].visible && !selected)
                        continue;
                    out.push('<option value="' + this.matchers[i].name + '" ' + seleStr + '>' + this.matchers[i].displayName + '</option>');
                }
                out.push("</select>");
                return out.join("");
            }, this)
        },{
            header: "",
            width: 90,
            sortable: false,
            resizable: false,
            menuDisabled: true,
            dataIndex: "invert",
            renderer: Ext.bind(function(value, metadata, record, rowIndex, colIndex, store) {
                var rule=this.matchersMap[record.get("name")];
                var out=[];
                out.push('<select class="rule_builder_invert" onchange="Ext.getCmp(\''+this.getId()+'\').changeRowInvert(\''+record.getId()+'\', this)">');
                out.push('<option value="false" ' + ((value==false)?"selected":"") + '>' + this.settingsCmp.i18n._("is")     + '</option>');
                if (rule == null || rule.allowInvert == null || rule.allowInvert == true)
                    out.push('<option value="true"  ' + ((value==true) ?"selected":"") + '>' + this.settingsCmp.i18n._("is NOT") + '</option>');
                out.push("</select>");
                return out.join("");
            }, this)
        },{
            header: this.settingsCmp.i18n._("Value"),
            width: 315,
            flex: 1,
            sortable: false,
            resizable: false,
            menuDisabled: true,
            dataIndex: "value",
            renderer: Ext.bind(function(value, metadata, record, rowIndex, colIndex, store) {
                var name=record.get("name");
                value=record.data.value;
                var rule=this.matchersMap[name];
                var res="";
                if (!rule) {
                    return "";
                }
                switch(rule.type) {
                  case "text":
                    res='<input type="text" size="30" class="x-form-text x-form-field rule_builder_value" onchange="Ext.getCmp(\''+this.getId()+'\').changeRowValue(\''+record.getId()+'\', this)" value="'+value+'"/>';
                    break;
                  case "boolean":
                    res="<div>" + this.settingsCmp.i18n._("True") + "</div>";
                    break;
                  case "editor":
                    res='<input type="text" size="30" class="x-form-text x-form-field rule_builder_value" onclick="Ext.getCmp(\''+this.getId()+'\').openRowEditor(\''+record.getId()+'\', \''+rule.editor.getId()+'\', this)" onchange="Ext.getCmp(\''+this.getId()+'\').changeRowValue(\''+record.getId()+'\', this)" value="'+value+'"/>';
                    break;
                  case "checkgroup":
                    var values_arr=(value!=null && value.length>0)?value.split(","):[];
                    var out=[];
                    for(var count=0; count<rule.values.length; count++) {
                        var rule_value=rule.values[count][0];
                        var rule_label=rule.values[count][1];
                        var checked_str="";
                        for(var j=0;j<values_arr.length; j++) {
                            if(values_arr[j]==rule_value) {
                                checked_str="checked";
                                break;
                            }
                        }
                        out.push('<div class="checkbox" style="width:100px; float: left; padding:3px 0;">');
                        out.push('<input id="'+rule_value+'[]" class="rule_builder_checkbox" '+checked_str+' onchange="Ext.getCmp(\''+this.getId()+'\').changeRowValue(\''+record.getId()+'\', this)" style="display:inline; float:left;margin:0;" name="'+rule_label+'" value="'+rule_value+'" type="checkbox">');
                        out.push('<label for="'+rule_value+'[]" style="display:inline;float:left;margin:0 0 0 0.6em;padding:0;text-align:left;width:50%;">'+rule_label+'</label>');
                        out.push('</div>');
                    }
                    res=out.join("");
                    break;
                }
                return res;

            }, this)
        }, deleteColumn];
        this.callParent(arguments);
    },
    openRowEditor: function(recordId,editorId,valObj) {
        var record=this.store.getById(recordId);
        var editor=Ext.getCmp(editorId);
        if (editor == null) {
            Ext.MessageBox.alert(i18n._("Warning"),i18n._("Missing Editor"));
            return;
        }

        editor.populate(record, valObj.value, this);
        editor.show();
    },
    changeRowType: function(recordId,selObj) {
        var record=this.store.getById(recordId);
        var newName=selObj.options[selObj.selectedIndex].value;
        if (newName == "") {
            Ext.MessageBox.alert(i18n._("Warning"),i18n._("A valid type must be selected."));
            return;
        }
        var i;
        // iterate through and make sure there are no other matchers of this type
        for (i = 0; i < this.store.data.length ; i++) {
            if (this.store.data.items[i].data.id == recordId)
                continue;
            if (this.store.data.items[i].data.name == newName) {
                Ext.MessageBox.alert(i18n._("Warning"),i18n._("A matcher of this type already exists in this rule."));
                record.set("name","");
                selObj.value = "";
                return;
            }
        }
        // find the selected matcher
        var rule=this.matchersMap[newName];
        var newValue="";
        if(rule.type=="boolean") {
            newValue="true";
        }
        selObj.value.vtype=rule.vtype;
        record.data.vtype=rule.vtype;
        record.data.value=newValue;
        record.set("name",newName);
        this.dirtyFlag=true;
        this.fireEvent("afteredit");
    },
    changeRowInvert: function(recordId,selObj) {
        var record=this.store.getById(recordId);
        var newValue=selObj.options[selObj.selectedIndex].value;
        record.data.invert = newValue;
        this.dirtyFlag=true;
    },
    changeRowValue: function(recordId,valObj) {
        var record=this.store.getById(recordId);
       
        switch(valObj.type) {
          case "checkbox":
            var record_value=record.get("value");
            var values_arr=(record_value!=null && record_value.length>0)?record_value.split(","):[];
            if(valObj.checked) {
                values_arr.push(valObj.value);
            } else {
                for(var i=0;i<values_arr.length;i++) {
                    if(values_arr[i]==valObj.value) {
                        values_arr.splice(i,1);
                        break;
                    }
                }
            }
            record.data.value=values_arr.join(",");
            break;
          case "text":
            var new_value=valObj.value;
            if(new_value!=null) {
                new_value.replace("::","");
                new_value.replace("&&","");
            }
            switch (record.get('vtype')) {
                case "portMatcher": 
                    if ( !Ext.form.field.VTypes.portMatcher(new_value)) {
                        valObj.value='';
                        valObj.select();
                        valObj.setAttribute('style','border:1px #C30000 solid');
                    } else {
                        valObj.removeAttribute('style');
                        record.data.value=new_value;
                    }
                    break;
                case "ipMatcher": 
                    if ( !Ext.form.field.VTypes.ipMatcher(new_value)) {
                        valObj.value='';
                        valObj.select();
                        valObj.setAttribute('style','border:1px #C30000 solid');
                    } else {
                        valObj.removeAttribute('style');
                        record.data.value=new_value;
                    }
                    break;
                default:
                    record.data.value=new_value;
            }
            break;
        }
        this.dirtyFlag = true;
        this.fireEvent("afteredit");
    },
    addHandler: function() {
        var record=Ext.create(this.modelName,Ext.decode(Ext.encode(this.recordDefaults)));
        this.getStore().add([record]);
        this.fireEvent("afteredit");
    },
    deleteHandler: function (record) {
        this.store.remove(record);
        this.fireEvent("afteredit");
    },
    setValue: function(value) {
        this.dirtyFlag=false;
        var entries=[];
        var rule;
        if (value != null && value.list != null) {
            for(var i=0; i<value.list.length; i++) {
                if ( value.list[i].vtype == undefined) {
                    // get the vtype for the current value
                    rule=this.matchersMap[value.list[i].matcherType];
                    if(rule) {
                        value.list[i].vtype=rule.vtype;
                    }
                }
                entries.push( [value.list[i].matcherType, value.list[i].invert, value.list[i].value, value.list[i].vtype] );
            }
        }
        this.store.loadData(entries);
    },
    getValue: function() {
        var list=[];
        var records=this.store.getRange();
        for(var i=0; i<records.length;i++) {
            list.push({
                javaClass: this.javaClass,
                matcherType: records[i].get("name"),
                invert: records[i].get("invert"),
                value: records[i].get("value"),
                vtype: records[i].get("vtype")});
        }
        return {
            javaClass: "java.util.LinkedList", 
            list: list,
            //must override toString in order for all objects not to appear the same
            toString: function() {
                return Ext.encode(this);
            }
        };
    },
    getName: function() {
        return "rulebuilder";
    },
    beforeDestroy: function() {
        for (var i = 0; i < this.matchers.length; i++) {
            if (this.matchers[i].editor !=null ) {
                Ext.destroy(this.matchers[i].editor);
            }
        }
        this.callParent(arguments);
    },
    isValid: function() {
        // check that all the matchers have a selected type and value
        var records=this.store.getRange();
        var rule;
        for(var i=0; i<records.length;i++) {
            var record=records[i];
            if(Ext.isEmpty(record.get("name"))) {
                return i18n._("A valid type must be selected for all matchers.");
            } else {
                rule=this.matchersMap[record.get("name")];
                if(rule.type=='text') {
                    if(Ext.isEmpty(record.get("value"))) {
                        if(rule.allowBlank!==true) {
                            if(record.get("vtype")=='portMatcher') {
                                return Ext.form.field.VTypes.portMatcherText;
                            } else if(record.get("vtype")=='ipMatcher') {
                                return Ext.form.field.VTypes.ipMatcherText;
                            } else {
                                return Ext.String.format(i18n._("{0} value is required."), rule.displayName);
                            }
                        }
                    }
                }
            } 
        }
        return true;
    },
    isDirty: function() {
        return this.dirtyFlag;
    },
    clearDirty: function() {
        this.dirtyFlag = false;
    }
});

Ung.RuleValidator = {
    isSinglePortValid: function(val) {
        /* check for values between 0 and 65536 */
        if ( val < 0 || val > 65536 )
            return false;
        /* verify its an integer (not a float) */
        if( ! /^\d{1,5}$/.test( val ) )
            return false;
        return true;
    },
    isPortRangeValid: function(val) {
        var portRange = val.split('-');
        if ( portRange.length != 2 )
            return false;
        return this.isSinglePortValid(portRange[0]) && this.isSinglePortValid(portRange[1]);
    },
    isPortListValid: function(val) {
        var portList = val.split(',');
        var retVal = true;
        for ( var i = 0; i < portList.length;i++) {
            if ( portList[i].indexOf("-") != -1) {
                retVal = retVal && this.isPortRangeValid(portList[i]);
            } else {
                retVal = retVal && this.isSinglePortValid(portList[i]);
            }
            if (!retVal) {
                return false;
            }
        }
        return true;
    },
    isSingleIpValid: function(val) {
        var ipAddrMaskRe = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipAddrMaskRe.test(val);
    },
    isIpRangeValid: function(val) {
        var ipAddrRange = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)-(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipAddrRange.test(val);
    },
    isCIDRValid: function(val) {
        var cidrRange = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/[0-3]?[0-9]$/;
        return cidrRange.test(val);
    },
    isIpNetmaskValid:function(val) {
        var ipNetmask = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipNetmask.test(val);
    },
    isIpListValid: function(val) {
        var ipList = val.split(',');
        var retVal = true;
        for ( var i = 0; i < ipList.length;i++) {
            if ( ipList[i].indexOf("-") != -1) {
                retVal = retVal && this.isIpRangeValid(ipList[i]);
            } else {
                if ( ipList[i].indexOf("/") != -1) {
                    retVal = retVal && ( this.isCIDRValid(ipList[i]) || this.isIpNetmaskValid(ipList[i]));
                } else {
                    retVal = retVal && this.isSingleIpValid(ipList[i]);
                }
            }
            if (!retVal) {
                return false;
            }
        }
        return true;
    }
};