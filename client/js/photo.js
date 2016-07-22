"use strict";

App.module('Photo', function (Photo, App) {
    Photo.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'photos': 'index',
            'photos/:id': 'index'
            // 'video/:id': 'view',
        }
    });

    Photo.channel = Backbone.Radio.channel('photo');

    Photo.List = App.PageableCollection.extend({
        url: '/api/file',

        query: {
            type: 'photo',
            owner_id: null
        },

        model: function (attrs, options) {
            return new App.File.Model(attrs, options);
        }
    });

    Photo.Thumbnail = Marionette.View.extend({
        template: '#view-empty',
        tagName: 'a',

        attributes: {
            'class': 'photo-thumbnail',
            draggable: true
        },

        events: {
            'click': 'open',
            'dragstart': 'dragstart',
            'dragend': 'dragend'
        },

        dragstart: function (e) {
            e = e.originalEvent;
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/json', JSON.stringify(this.model.attributes));
            // var image = new Image();
            // image.width = 128;
            // image.height = 128;
            // image.src = this.model.getFileURL();
            // e.dataTransfer.setDragImage(image, 0, 0);
            // return false;
        },

        dragend: function (e) {
            e.preventDefault();
        },

        open: function (e) {
            e.preventDefault();
            return Photo.channel.request('open', this.model);
        },

        onRender: function () {
            this.el.setBackground(this.model.getFileURL());
            this.$el.attr('data-id', this.model.get('_id'));
            this.stickit();
        }
    });

    Photo.ListView = Marionette.CollectionView.extend({
        childView: Photo.Thumbnail,

        attributes: {
            'class': 'view photo-list'
        },

        behaviors: {
            Pageable: {}
        }
    }, {
        widget: function (region, options) {
            var list = new Photo.List([], {
                query: _.pick(options, 'owner_id')
            });
            var listView = new Photo.ListView({
                collection: list.fullCollection
            });
            region.show(listView);
            list.getFirstPage();
            return listView;
        }
    });

    Photo.Place = Marionette.View.extend({
        template: '#view-empty',

        behaviors: {
            Bindings: {}
        },

        bindings: {}
    });

    Photo.View = Marionette.View.extend({
        template: '#view-video',

        initialize: function () {
            var self = this;
            this.model = new Backbone.Model();
            return Photo.channel.reply('open', (function (model) {
                self.model = model;
                self.ui.frame.html(model.get('html'));
            }));
        },

        ui: {
            frame: '.frame'
        },

        bindings: {
            '.title': 'title'
        },

        behaviors: {
            Bindings: {}
        }
    });

    Photo.Layout = Marionette.View.extend({
        template: '#view-photo-search',

        initialize: function () {
            this.model = new Backbone.Model();
            this.getRegion('list').on('show', _.bind(this.setupModel, this));
        },

        attributes: {
            'class': 'view photo-search'
        },

        bindings: {
            '[type=search]': 'q'
        },

        regions: {
            list: '.list'
        },

        ui: {
            title: '.title',
            current: '.current',
            list: '.list',
            resize: '.resize',
            search: '[type=search]'
        },

        events: {
            'keyup @ui.search': 'search',
            'change @ui.search': 'search',
            'click .upload': 'upload'
        },

        upload: function () {
            var self = this;
            var owner_id = this.model.get('_id');
            var upload = App.Views.uploadDialog({
                accept: 'image/jpeg',
                multiple: true,
                params: {
                    owner_id: owner_id
                }
            });
            upload.on('response', function (data) {
                var file = new App.File.Model(data);
                self.getRegion('list').currentView.collection.add(file);
            })
        },

        getCollection: function () {
            return this.getRegion('list').currentView.collection.pageableCollection;
        },

        setupModel: function () {
            this.model = this.getCollection().queryModel;
            return this.stickit();
        },

        search: function (e) {
            var self = this;
            if (EmptyKeys.indexOf(e.key) < 0) {
                this.ui.list.busy(true);
                this.getCollection().delaySearch(function () {
                    self.ui.list.busy(false);
                });
            }
            this.stickit();
        },

        onRender: function () {
            if (App.config.search) {
                this.ui.search.removeClass('hidden');
            }
        }
    }, {
        widget: function (region, options) {
            var layout = new Photo.Layout();
            region.show(layout);
            Photo.ListView.widget(layout.getRegion('list'), options);
            return layout;
        }
    });

    return new Photo.Router({
        controller: {
            index: function (domain) {
                App.User.View.widget(App.getPlace('main'), App.User.optionsFromId(domain))
                    .then(function (profile) {
                        Photo.Layout.widget(profile.getRegion('content'), {
                            owner_id: profile.model.id
                        });
                    });
            }
        }
    });
});
