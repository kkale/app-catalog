(function () {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.apps.treegrid.TreeGridApp', {
        extend: 'Rally.apps.common.GridBoardApp',
        alias: 'widget.treegridapp',

        config: {
            defaultSettings: {
                modelNames: ['hierarchicalrequirement'],
                columnNames: ['Name', 'Owner', 'Project', 'PercentDoneByStoryPlanEstimate', 'PercentDoneByStoryCount', 'PlannedStartDate', 'PlannedEndDate']
            }
        },

        getStateId: function () {
            return 'custom';
        },

        loadModelNames: function () {
            return Deft.Promise.when(this.getSetting('modelNames'));
        },

        getHeaderControls: function () {
            var typePicker = Ext.create('Rally.ui.combobox.ModelTypeComboBox', {
                value: this.modelNames[0],
                listeners: {
                    select: function (picker, records) {
                        this._onTypeChange(records[0]);
                    },
                    scope: this
                }
            });
            return this.callParent(arguments).concat(typePicker);
        },

        _onTypeChange: function (newType) {
            this.modelNames = [newType.get('TypePath')];

            if (this.toggleState === 'grid') {
                this.gridboard.fireEvent('modeltypeschange', this.gridboard, [newType]);
            } else {
                this.loadGridBoard();
            }
        }/*,

        getGridStoreConfig: function () {
            return {
                enableHierarchy: false,
                childPageSizeEnabled: false
            };
        }*/
    });
})();
