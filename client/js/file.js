'use strict';

App.module('File', function (File, App) {
    File.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'upload': 'upload'
        }
    });

    File.Model = Backbone.Model.extend({
        getFileURL: function () {
            return (this.get('md5') ? '/md5/' + this.get('md5') : '/id/' + this.get('_id')) + '.' + this.get('ext');
        }
    });

    File.View = Marionette.View.extend({
        template: '#view-upload',
        tagName: 'form',

        events: {
            'click button': 'upload'
        },

        ui: {
            id: '[name="id"]'
        },

        upload: function () {
            App.Views.uploadDialog({
                params: {
                    owner_id: App.user._id,
                    id: this.ui.id.val()
                }
            });
        }
    });

    return new File.Router({
        controller: {
            upload: function () {
                App.getPlace('main').show(new File.View());
            }
        }
    });
});
