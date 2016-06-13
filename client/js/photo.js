"use strict";

App.module('Photo', function (Photo, App) {
    Photo.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'video': 'index',
            // 'video/:id': 'view',
            'unsupported(/:type)': 'unsupported'
        }
    });

    App.channels.video = Backbone.Radio.channel('photo');

    Photo.List = App.PageableCollection.extend({
        url: '/api/file',

        queryModelInitial: {
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

        events: {
            'click': 'open'
        },

        behaviors: {
            Bindings: {}
        },

        open: function (e) {
            e.preventDefault();
            return App.channels.video.request('open', this.model);
        },

        onRender: function () {
            this.el.setBackground(this.model.getFileURL());
        }
    });

    Photo.ListView = Marionette.CollectionView.extend({
        childView: Photo.Thumbnail,

        behaviors: {
            Pageable: {}
        }
    }, {
        widget: function (region) {
            var list = new Photo.List();
            var listView = new Photo.ListView({
                collection: list.fullCollection
            });
            region.show(listView);
            list.getFirstPage();
            return listView;
        }
    });

    Photo.View = Marionette.View.extend({
        template: '#view-video',

        initialize: function () {
            this.model = new Backbone.Model();
            return App.channels.video.reply('open', (function (_this) {
                return function (model) {
                    _this.model = model;
                    return _this.ui.frame.html(model.get('html'));
                };
            })(this));
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
        template: '#layout-video-list',

        initialize: function () {
            this.model = new Backbone.Model();
            this.getRegion('list').on('show', _.bind(this.setupModel, this));
        },

        behaviors: {
            Bindings: {}
        },

        bindings: {
            '[type=search]': 'q'
        },

        regions: {
            current: '.current',
            list: '.list'
        },

        ui: {
            title: '.title',
            current: '.current',
            list: '.list',
            resize: '.resize',
            search: 'input'
        },

        events: {
            'keyup @ui.search': 'search',
            'change @ui.search': 'search'
        },

        getCollection: function () {
            return this.getRegion('list').currentView.collection.pageableCollection;
        },

        setupModel: function () {
            this.model = this.getCollection().queryModel;
            return this.stickit();
        },

        search: function (e) {
            if (EmptyKeys.indexOf(e.keyCode) < 0) {
                this.ui.list.busy(true);
                return this.getCollection().delaySearch((function (_this) {
                    return function () {
                        return _this.ui.list.busy(false);
                    };
                })(this));
            }
        }
    });

    return new Photo.Router({
        controller: {
            index: function () {
                return Photo.Layout.widget(App.getPlace('main'));
            },

            unsupported: function () {
                return App.mainRegion.show(new Photo.Unsupported());
            }
        }
    });
});
