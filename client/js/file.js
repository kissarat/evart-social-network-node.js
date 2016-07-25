'use strict';

App.module('File', function (File, App) {
    File.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'upload': 'upload'
        }
    });

    File.Model = Backbone.Model.extend({
        idAttribute: '_id',

        getFileURL: function () {
            var url;
            if (this.get('ext')) {
                if (this.has('md5')) {
                    url = '/md5/' + this.get('md5');
                }
                else {
                    url = '/id/' + this.get('_id');
                }
                url += '.' + this.get('ext');
            }
            else {
                url = '/api/file?id=' + this.id;
            }
            return url;
        }
    });

    File.List = App.PageableCollection.extend({
        url: '/api/file',

        query: {
            type: 'photo',
            owner_id: null
        },

        model: function (attrs, options) {
            if ('string' == typeof attrs) {
                attrs = {_id: attrs};
            }
            return new App.File.Model(attrs, options);
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

    File.ListView = Marionette.CollectionView.extend({
        childView: function (model) {
            if ('photo' == model.get('type')) {
                return App.Photo.Thumbnail;
            }
            else {
                throw new Error(JSON.stringify(model.attributes));
            }
        }
    });

    File.AttachmentList = Backbone.Collection.extend({
        model: function (attrs, options) {
            return new File.Model(attrs, options);
        }
    });

    File.AttachmentListView = Marionette.CollectionView.extend({
        childView: function () {
            return App.Photo.Thumbnail;
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
