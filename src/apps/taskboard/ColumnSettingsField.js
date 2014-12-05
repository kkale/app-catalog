(function() {
    var Ext = window.Ext4 || window.Ext;

    /**
     * Allows configuration of wip and schedule state mapping for kanban columns
     *
     *      @example
     *      Ext.create('Ext.Container', {
     *          items: [{
     *              xtype: 'kanbancolumnsettingsfield',
     *              value: {}
     *          }],
     *          renderTo: Ext.getBody().dom
     *      });
     *
     */
    Ext.define('Rally.apps.kanban.ColumnSettingsField', {
        extend: 'Ext.form.field.Base',
        alias: 'widget.kanbancolumnsettingsfield',
        plugins: ['rallyfieldvalidationui'],
        requires: [
            'Rally.ui.combobox.ComboBox',
            'Rally.ui.TextField',
            'Rally.ui.combobox.FieldValueComboBox',
            'Rally.ui.plugin.FieldValidationUi',
            'Rally.apps.kanban.ColumnCardFieldPicker'
        ],

        fieldSubTpl: '<div id="{id}" class="settings-grid"></div>',

        width: 600,
        cls: 'column-settings',

        config: {
            /**
             * @cfg {Object}
             *
             * The column settings value for this field
             */
            value: undefined,

            defaultCardFields: ''
        },

        onDestroy: function() {
            if (this._grid) {
                this._grid.destroy();
                delete this._grid;
            }
            this.callParent(arguments);
        },

        onRender: function() {
            this.callParent(arguments);

            this._store = Ext.create('Ext.data.Store', {
                fields: ['column', 'statemap'],
                data: []
            });

            this._grid = Ext.create('Rally.ui.grid.Grid', {
                autoWidth: true,
                renderTo: this.inputEl,
                columnCfgs: this._getColumnCfgs(),
                showPagingToolbar: false,
                showRowActionsColumn: false,
                enableRanking: false,
                store: this._store,
                editingConfig: {
                    publishMessages: false
                }
            });
        },

        _getColumnCfgs: function() {
            var columns = [
                {
                    text: 'Column',
                    dataIndex: 'column',
                    emptyCellText: 'None',
                    flex: 2
                },
                {
                    text: 'Task State Mapping',
                    dataIndex: 'statemap',
                    emptyCellText: '--No Mapping--',
                    flex: 2,
                    editor: {
                        xtype: 'rallyfieldvaluecombobox',
                        model: Ext.identityFn('Task'),
                        field: 'State',
                        listeners: {
                            ready: function (combo) {
                                var noMapping = {};
                                noMapping[combo.displayField] = '--No Mapping--';
                                noMapping[combo.valueField] = '';

                                combo.store.insert(0, [noMapping]);
                            }
                        }
                    }
                }
            ];

            return columns;
        },

        /**
         * When a form asks for the data this field represents,
         * give it the name of this field and the ref of the selected project (or an empty string).
         * Used when persisting the value of this field.
         * @return {Object}
         */
        getSubmitData: function() {
            var data = {};
            data[this.name] = Ext.JSON.encode(this._buildSettingValue());
            return data;
        },

        _getRendererForCardFields: function(fields) {
            var valWithoutPrefixes = [];
            Ext.Array.each(this._getCardFields(fields), function(field) {
                valWithoutPrefixes.push(field.replace(/^c_/, ''));
            });
            return valWithoutPrefixes.join(', ');
        },

        _getCardFields: function(fields) {
            if (Ext.isString(fields) && fields) {
                return fields.split(',');
            }
            var val = ['FormattedID','Name'];
            Ext.Array.each(fields, function (currentItem) {
                if (currentItem && currentItem.data && !Ext.Array.contains(val, currentItem.data.name)) {
                    val.push(currentItem.data.name);
                }
            });
            return val;
        },

        _updateColumnCardFieldSettings: function(picker, selectedRecord, value, initialText) {
            this._store.each(function(record) {
                var cardFields = this._getCardFields(record.get('cardFields'));

                if (initialText) {
                    if (!Ext.Array.contains(cardFields, selectedRecord.get('name'))) {
                        cardFields.push(selectedRecord.get('name'));
                    }
                } else {
                    Ext.Array.remove(cardFields, selectedRecord.get('name'));
                }
                record.set('cardFields', cardFields.join(','));
            }, this);

            this._store.loadRawData(this._store.getRange());
        },

        _buildSettingValue: function() {
            var columns = {};
            this._store.each(function(record) {
                columns[record.get('column')] = {
                    statemap: record.get('statemap')
                };
                if (this.shouldShowColumnLevelFieldPicker) {
                    var cardFields = this._getCardFields(record.get('cardFields'));
                    columns[record.get('column')].cardFields = cardFields.join(',');
                }
            }, this);
            return columns;
        },

        getErrors: function() {
            var errors = [];
            if (this._storeLoaded && !Ext.Object.getSize(this._buildSettingValue())) {
                errors.push('Unknown error happened');
            }
            return errors;
        },

        setValue: function(value) {
            this.callParent(arguments);
            this._value = value;
        },

        _getColumnValue: function(columnName) {
            var value = this._value;
            return value && Ext.JSON.decode(value)[columnName];
        },

        refreshWithNewField: function(field) {
            delete this._storeLoaded;
            field.getAllowedValueStore().load({
                callback: function(records, operation, success) {
                    var data = Ext.Array.map(records, this._recordToGridRow, this);
                    this._store.loadRawData(data);
                    this.fireEvent('ready');
                    this._storeLoaded = true;
                },
                scope: this
            });
        },

        _recordToGridRow: function(allowedValue) {
            var columnName = allowedValue.get('StringValue');
            var pref = this._store.getCount() === 0 ? this._getColumnValue(columnName) : null;

            var column = {
                column: columnName,
                statemap: ''
            };
            
            console.log("Pref: ", pref);

            if (pref) {
                Ext.apply(column, {
                    statemap: pref.statemap
                });

                if (pref.cardFields) {
                    Ext.apply(column, {
                        cardFields: pref.cardFields
                    });
                }
            }

            return column;

        }
    });
})();