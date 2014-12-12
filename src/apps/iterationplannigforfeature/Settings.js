(function () {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.apps.board.Settings', {
        singleton: true,
        requires: [
            'Rally.ui.combobox.FieldComboBox',
            'Rally.ui.combobox.ComboBox',
            'Rally.ui.TextField',
            'Rally.ui.NumberField',
            'Rally.apps.common.RowSettingsField',
            'Rally.data.wsapi.Filter'
        ],

        getFields: function (context) {
            return [
                {
                    name: 'type',
                    xtype: 'rallycombobox',
                    shouldRespondToScopeChange: true,
                    context: context,
                    storeConfig: {
                        model: Ext.identityFn('TypeDefinition'),
                        sorters: [
                            {
                                property: 'Name'
                            }
                        ],
                        fetch: ['DisplayName', 'ElementName', 'TypePath', 'Parent'],
                        filters: [
                            {
                                property: 'Creatable',
                                value: true
                            }
                        ],
                        autoLoad: false,
                        remoteSort: false,
                        remoteFilter: true
                    },
                    displayField: 'DisplayName',
                    valueField: 'TypePath',
                    listeners: {
                        select: function (combo, records) {
                            combo.fireEvent('typeselected', records[0].get('TypePath'), combo.context);
                        },
                        ready: function (combo) {
                            combo.store.sort('DisplayName');
                            combo.store.filterBy(function(record) {
                                var parent = record.get('Parent'),
                                    parentName = parent.ElementName;
                                return _.contains(['Artifact', 'SchedulableArtifact', 'Requirement', 'PortfolioItem'], parentName);
                            });
                            combo.fireEvent('typeselected', combo.getRecord().get('TypePath'), combo.context);
                        }
                    },
                    bubbleEvents: ['typeselected'],
                    readyEvent: 'ready',
                    handlesEvents: {
                        projectscopechanged: function (context) {
                            this.refreshWithNewContext(context);
                        }
                    }
                },
                {
                    name: 'groupByField',
                    fieldLabel: 'Columns',
                    xtype: 'rallyfieldcombobox',
                    readyEvent: 'ready',
                    handlesEvents: {
                        typeselected: function (type, context) {
                            this.refreshWithNewModelType(type, context);
                        }
                    },
                    listeners: {
                        ready: function (combo) {
                            combo.store.filterBy(function (record) {
                                var attr = record.get('fieldDefinition').attributeDefinition;
                                return attr && !attr.ReadOnly && attr.Constrained && attr.AttributeType !== 'COLLECTION';
                            });
                            var fields = Ext.Array.map(combo.store.getRange(), function (record) {
                                return record.get(combo.getValueField());
                            });
                            if (!Ext.Array.contains(fields, combo.getValue())) {
                                combo.setValue(fields[0]);
                            }
                        }
                    }
                },
                {
                    name: 'groupHorizontallyByField',
                    xtype: 'rowsettingsfield',
                    fieldLabel: 'Swimlanes',
                    margin: '10 0 0 0',
                    mapsToMultiplePreferenceKeys: ['showRows', 'rowsField'],
                    readyEvent: 'ready',
                    explicitFields: [
                        {name: 'Blocked', value: 'Blocked'},
                        {name: 'Expedite', value: 'Expedite'},
                        {name: 'Owner', value: 'Owner'},
                        {name: 'Sizing', value: 'PlanEstimate'}
                    ],
                    includeCustomFields: true,
                    includeConstrainedNonCustomFields: true,
                    includeObjectFields: true,
                    handlesEvents: {
                        typeselected: function(type, context) {
                            this.refreshWithNewModelType(type, context);
                        }
                    }
                },
                {
                    name: 'order',
                    xtype: 'rallytextfield'
                },
                {
                    type: 'query'
                }
            ];
        }
    });
})();