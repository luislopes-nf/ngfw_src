// Monitor Grid class
Ext.define('Ung.MonitorGrid', {
    extend:'Ext.grid.Panel',
    selType: 'rowmodel',
    // settings component
    settingsCmp: null,
    //an application selector
    appList: null,
    // the total number of records
    autoRefreshEnabled: false,
    stateful: true,
    columnsDefaultSortable: true,
    features: [{
        ftype: 'grouping'
    }],
    constructor: function(config) {
        var defaults = {
            viewConfig: {
                enableTextSelection: true,
                stripeRows: true,
                loadMask:{
                    msg: i18n._("Loading...")
                }
            },
            plugins: [],
            changedData: {},
            subCmps:[],
            stateId: "monitorGrid-"+config.name
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
            if( col.stateId === undefined ){
                col.stateId = col.dataIndex;
            }
        }
        this.store=Ext.create('Ext.data.Store', {
            data: [],
            fields: this.fields,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json'
                }
            },
            sorters: this.sortField ? {
                property: this.sortField,
                direction: this.sortOrder ? this.sortOrder: "ASC"
            }: undefined,
            groupField: this.groupField
        });
        this.bbar=[];
        if(this.appList!=null) {
            this.bbar.push({
                xtype: 'tbtext',
                name: 'appSelectorBox',
                text: ''
            });
        }
        this.bbar.push({
            xtype: 'button',
            name: 'refresh',
            text: i18n._('Refresh'),
            tooltip: i18n._('Refresh'),
            iconCls: 'icon-refresh',
            handler: Ext.bind(function() {
                this.reload();
            }, this)
        },{
            xtype: 'button',
            name: 'auto_refresh',
            text: i18n._('Auto Refresh'),
            enableToggle: true,
            pressed: false,
            tooltip: i18n._('Auto Refresh'),
            iconCls: 'icon-autorefresh',
            handler: Ext.bind(function() {
                if(this.down('button[name=auto_refresh]').pressed) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            }, this)
        }, '-', i18n._('Filter:'), {
            xtype: 'textfield',
            name: 'searchField',
            hideLabel: true,
            width: 130,
            listeners: {
                change: {
                    fn: function() {
                        this.filterFeature.updateGlobalFilter(this.searchField.getValue(), this.caseSensitive.getValue());
                    },
                    scope: this,
                    buffer: 600
                }
            }
        }, {
            xtype: 'checkbox',
            name: 'caseSensitive',
            hideLabel: true,
            boxLabel: i18n._('Case sensitive'),
            margin: '0 4px 0 4px',
            handler: function() {
                this.filterFeature.updateGlobalFilter(this.searchField.getValue(),this.caseSensitive.getValue());
            },
            scope: this
        }, '-', {
            text: i18n._('Clear Filters'),
            tooltip: i18n._('Filters can be added by clicking on column headers arrow down menu and using Filters menu'),
            handler: Ext.bind(function () {
                this.clearFilters();
                this.searchField.setValue("");
            }, this)
        },{
                text: i18n._('Clear Grouping'),
            tooltip: i18n._('Grouping can be used by clicking on column headers arrow down menu and clicking Group by this field'),
            handler: Ext.bind(function () {
                this.getStore().clearGrouping();
            }, this)
        },{
            text: i18n._('Reset View'),
            tooltip: i18n._('Restore default columns positions, widths and visibility'),
            handler: Ext.bind(function () {
                Ext.state.Manager.clear(this.stateId);
                this.reconfigure(this.getStore(), this.initialConfig.columns);
            }, this)
        });
        
        this.plugins.push('gridfilters');
        this.filterFeature=Ext.create('Ung.grid.feature.GlobalFilter', {});
        this.features.push(this.filterFeature);
        
        this.callParent(arguments);
        this.searchField=this.down('textfield[name=searchField]');
        this.caseSensitive = this.down('checkbox[name=caseSensitive]');
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
            this.down('[name=appSelectorBox]').setText(out.join(""));
        }
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
    reload: function(hideLoadingMask, handler) {
        var dataFnHandler = Ext.bind(function(result, exception) {
            if(Ung.Util.handleException(exception)) return;
            this.getStore().getProxy().setData(result.list);
            this.getStore().load();
            if(!hideLoadingMask) {
                this.getView().setLoading(false);
            }
            if(handler) {
                handler();
            }
        }, this);
        if(!hideLoadingMask) {
            this.getView().setLoading(true);
        }
        if (this.dataFnArg !== undefined ) {
            this.dataFn( dataFnHandler ,this.dataFnArg);
        } else {
            this.dataFn(dataFnHandler);
        }
    },
    beforeDestroy: function() {
        Ext.destroy(this.subCmps);
        this.callParent(arguments);
    },
    startAutoRefresh: function(setButton) {
        this.autoRefreshEnabled=true;
        if(setButton) {
            this.down('button[name=auto_refresh]').toggle(true);
        }
        this.down('button[name=refresh]').disable();
        this.autorefreshList();

    },
    stopAutoRefresh: function(setButton) {
        this.autoRefreshEnabled=false;
        if(setButton) {
            this.down('button[name=auto_refresh]').toggle(false);
        }
        this.down('button[name=refresh]').enable();
    },
    autorefreshList: function() {
        if(this!=null && this.autoRefreshEnabled && Ext.getCmp(this.id) != null) {
            this.reload(true, Ext.bind(function() {
                Ext.defer(this.autorefreshList, 9000, this);
            }, this));
        }
    },
    isDirty: function() {
        return false;
    }
});