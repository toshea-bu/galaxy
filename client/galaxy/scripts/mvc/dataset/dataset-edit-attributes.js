define( [ 'utils/utils', 'mvc/ui/ui-tabs', 'mvc/ui/ui-misc', 'mvc/form/form-view' ], function( Utils, Tabs, Ui, Form ) {

    /** Dataset edit attributes view */
    var View = Backbone.View.extend({
        initialize: function() {
            this.setElement( '<div/>' );
            this.model = new Backbone.Model( { 'dataset_id': Galaxy.params.dataset_id } );
            this.message = new Ui.Message( { persistent: true } );
            this.render();
        },

        // fetch data for the selected dataset and build forms
        render: function() {
            var self = this;
            $.ajax({
                url     : Galaxy.root + 'dataset/get_edit?dataset_id=' + self.model.get( 'dataset_id' ),
                success : function( response ) {
                   self._renderPage( self, response );
                },
                error   : function( response ) {
                    var err_msg = response.responseJSON && response.responseJSON.err_msg;
                    self.message.update({
                        'status'    : 'danger',
                        'message'   : err_msg || 'Error occured while loading the dataset.',
                        'persistent': true
                    });
                }
            });
        },

        /** Render all the tabs view */
        _renderPage: function( self, response ) {
            this.$el.empty()
                    .append( this.message.$el )
                    .append( this._getAttributesFormTemplate( response ) )
                    .append( this._getConvertFormTemplate( response ) )
                    .append( this._getChangeDataTypeFormTemplate( response ) )
                    .append( this._getPermissionsFormTemplate( response ) );
            this.message.update( response );
        },

        /** Perform AJAX post call */
        call_ajax: function( self, data, tab_name ) {
            var post_url = Galaxy.root + 'dataset/set_edit';
            $.ajax({
                type: "PUT",
                url: post_url,
                data: data,
                success: function( response ) {
                    self.reload_history();
                },
                error   : function( response ) {
                    var error_response = {
                        'status': 'error',
                        'message': 'Error occured while saving. Please fill all the required fields and try again.',
                        'persistent': true,
                        'cls': 'errormessage'
                    };
                    self.display_message( error_response, self.$( '.response-message' ) );
                }
            });
        },

        /** Display actions messages */
        display_message: function( response, $el ) {
            $el.empty().html( new Ui.Message( response ).$el );
        },

        /** Create tabs for different attributes of dataset*/
        create_tabs: function( response, $el_edit_attr ) {
            //var self = this;
            //self.tabs = new Tabs.View();
            this.$el.append( this._getAttributesFormTemplate( response ) );

/*
            self.tabs.add({
                id      : 'convert',
                title   : 'Convert',
                icon    : 'fa-gear',
                tooltip : 'Convert to new format',
                $el     :  self._getConvertFormTemplate( response )
            });

            self.tabs.add({
                id      : 'datatype',
                title   : 'Datatypes',
                icon    : 'fa-database',
                tooltip : 'Change data type',
                $el     : self._getChangeDataTypeFormTemplate( response )
            });

            self.tabs.add({
                id      : 'permissions',
                title   : 'Permissions',
                icon    : 'fa-user',
                tooltip : 'Permissions',
                $el     : self._getPermissionsFormTemplate( response )
            });
            $el_edit_attr.append( self.tabs.$el );
            self.tabs.showTab( 'attributes' );*/
        },

        /** Main template */
        _templateHeader: function() {
            return '<div class="page-container edit-attr">' +
                       '<div class="response-message"></div>' +
                       '<h3>Edit Dataset Attributes</h3>' +
                   '</div>';
        },

        /** Attributes tab template */
        _getAttributesFormTemplate: function( response ) {
            var self = this;
            var form = new Form({
                title  : 'Edit attributes',
                inputs : response.attribute_inputs,
                operations: {
                    'submit_editattr' : new Ui.ButtonIcon({
                        tooltip       : 'Save attributes of the dataset.',
                        icon          : 'fa-floppy-o ',
                        title         : 'Save attributes',
                        onclick       : function() { self._submit( self, form, response, "edit_attributes" ) }
                    }),
                    'submit_autocorrect' : new Ui.ButtonIcon({
                        tooltip          : 'This will inspect the dataset and attempt to correct the values of fields if they are not accurate.',
                        icon             : 'fa-undo ',
                        title            : 'Auto-detect',
                        onclick          : function() { self._submit( self, form, response, "auto-detect" ) }
                    })
                }
            });
            return form.$el;
        },

        /** Convert tab template */
        _getConvertFormTemplate: function( response ) {
            var self = this;
            var form = new Form({
                title  : 'Convert to new format',
                inputs : response.datatype_inputs,
                operations: {
                        'submit' : new Ui.ButtonIcon({
                        tooltip  : 'Convert the datatype to a new format.',
                        title    : 'Convert datatype',
                        icon     : 'fa-exchange ',
                        onclick  : function() { self._submit( self, form, response, "convert" ) }
                    })
                }
            });
            return form.$el;
        },

        /** Change datatype template */
        _getChangeDataTypeFormTemplate: function( response ) {
            var self = this;
            var form = new Form({
                title  : 'Change datatype',
                inputs : response.conversion_inputs,
                operations: {
                        'submit' : new Ui.ButtonIcon({
                        tooltip  : 'Change the datatype to a new type.',
                        title    : 'Change datatype',
                        icon     : 'fa-exchange ',
                        onclick  : function() { self._submit( self, form, response, "change" ) }
                    })
                }
            });
            return form.$el;
        },

        /** Permissions template */
        _getPermissionsFormTemplate: function( response ) {
            var template = "",
                self = this;
            if( response.can_manage_dataset ) {
                var form = new Form({
                    title  : 'Manage dataset permissions on ' + response.display_name,
                    inputs : response.permission_inputs,
                    operations: {
                        'submit': new Ui.ButtonIcon({
                            tooltip  : 'Save permissions.',
                            title    : 'Save permissions',
                            icon     : 'fa-floppy-o ',
                            onclick  : function() { self._submit( self, form, response, "permissions" ) }
                        })
                    }
                });
                return form.$el;
            }
            else {
                var form = new Form({
                    title  : 'View permissions',
                    inputs : response.permission_inputs
                });
                return form.$el;
            }
        },

        /** Submit action */
        _submit: function( self, form, response, type ) {
            var form_data = form.data.create();
            form_data.dataset_id = response.dataset_id;
            switch( type ) {
                case "edit_attributes":
                    form_data.save = 'Save';
                    break;

                case "auto-detect":
                    form_data.detect = 'Auto-detect';
                    break;
          
                case "convert":
                    if ( form_data.target_type !== null && form_data.target_type ) {
                        form_data.dataset_id = response.dataset_id;
                        form_data.convert_data = 'Convert';
                    }
                    break;

                case "change":
                    form_data.change = 'Save';
                    break;

                case "permissions":
                    var post_data = {};
                    post_data.permissions = JSON.stringify( form_data );
                    post_data.update_roles_button = "Save";
                    post_data.dataset_id = response.dataset_id;
                    form_data = post_data;
                    break; 
            }
            self.call_ajax( self, form_data );
        },

        /** Reload Galaxy's history after updating dataset's attributes */
        reload_history: function() {
            if ( window.Galaxy ) {
                window.Galaxy.currHistoryPanel.loadCurrentHistory();
            }
        }
    });

    return {
        View  : View
    };
});
