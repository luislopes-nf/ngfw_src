Ext.define('Ung.rpc.Rpc', {
    alternateClassName: 'Rpc',
    singleton: true,

    // loadWebUi: function() {
    //     var deferred = new Ext.Deferred(), me = this;
    //     this.getWebuiStartupInfo(function (result, exception) {
    //         if (exception) { deferred.reject(exception); }
    //         Ext.apply(me, result);
    //         console.log('hahaha');


    //         String.prototype.translate = function() {
    //             var record = Rpc.rpc.translations[this.valueOf()], value;
    //             if (record === null) {
    //                 alert('Missing translation for: ' + this.valueOf()); // Key is not found in the corresponding messages_<locale>.properties file.
    //                 return this.valueOf(); // Return key name as placeholder
    //             }
    //             return value;
    //         };

    //         //console.log('Dashboard'.translate());

    //         if (me.nodeManager.node('untangle-node-reports')) {
    //             me.reportsManager = me.nodeManager.node('untangle-node-reports').getReportsManager();
    //         }
    //         deferred.resolve();
    //     });
    //     return deferred.promise;
    // },



    getDashboardSettings: function () {
        console.time('dashboardSettings');
        var deferred = new Ext.Deferred();
        this.rpc.dashboardManager.getSettings(function (settings, exception) {
            console.timeEnd('dashboardSettings');
            if (exception) { deferred.reject(exception); }
            //Ung.app.dashboardSettings = result;

            //Ung.app.getStore('Widgets').loadRawData(result.widgets);
            //Ext.get('app-loader-text').setHtml('Loading widgets ...');
            deferred.resolve(settings);
        });
        return deferred.promise;
    },

    getReports: function () {
        console.time('loadReports');
        var deferred = new Ext.Deferred();
        if (this.rpc.nodeManager.node('untangle-node-reports')) {
            this.rpc.reportsManager = this.rpc.nodeManager.node('untangle-node-reports').getReportsManager();
            this.rpc.reportsManager.getReportEntries(function (result, exception) {
                console.timeEnd('loadReports');
                if (exception) { deferred.reject(exception); }
                // deferred.reject('aaa');
                deferred.resolve(result);
            });

        } else {
            deferred.resolve(null);
        }
        return deferred.promise;
    },

    getUnavailableApps: function () {
        console.time('unavailApps');
        var deferred = new Ext.Deferred();
        if (rpc.reportsManager) {
            rpc.reportsManager.getUnavailableApplicationsMap(function (result, exception) {
                console.timeEnd('unavailApps');
                if (exception) { deferred.reject(exception); }
                deferred.resolve(result);
                // Ext.getStore('unavailableApps').loadRawData(result.map);
                // Ext.getStore('widgets').loadData(settings.widgets.list);
                // me.loadWidgets();
            });
        } else {
            // Ext.getStore('widgets').loadData(settings.widgets.list);
            // me.loadWidgets();
            deferred.resolve(null);
        }
        return deferred.promise;
    },




    getReportData: function (entry, timeframe) {
        var deferred = new Ext.Deferred();
        this.rpc.reportsManager.getDataForReportEntry(function(result, exception) {
            if (exception) { deferred.reject(exception); }
            deferred.resolve(result);
        }, entry, timeframe, -1);
        return deferred.promise;
    },

    getRpcNode: function (nodeId) {
        var deferred = new Ext.Deferred();
        this.rpc.nodeManager.node(function (result, ex) {
            if (ex) { deferred.reject(ex); }
            deferred.resolve(result);
        }, nodeId);
        return deferred.promise;
    },

    getNodeSettings: function (node) {
        var deferred = new Ext.Deferred();
        node.getSettings(function (result, ex) {
            if (ex) { deferred.reject(ex); }
            deferred.resolve(result);
        });
        return deferred.promise;
    },

    setNodeSettings: function (node, settings) {
        console.log(settings);
        var deferred = new Ext.Deferred();
        node.setSettings(function (result, ex) {
            console.log(result);
            if (ex) { deferred.reject(ex); }
            deferred.resolve(result);
        }, settings);
        return deferred.promise;
    },




    readRecords: function () {
        console.log('read');
        return {};
    }


});