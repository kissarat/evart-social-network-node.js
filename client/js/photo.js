"use strict";

App.module('Photo', function (Photo, App) {
    Photo.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'video': 'index',
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

        behaviors: {
            Bindings: {}
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
        }
    });

    Photo.ListView = Marionette.CollectionView.extend({
        childView: Photo.Thumbnail,

        behaviors: {
            Pageable: {}
        }
    }, {
        widget: function (region, options) {
            var list = new Photo.List();
            _.each(options, function (value, key) {
                list.queryModel.set(key, value);
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
            this.model = new Backbone.Model();
            return Photo.channel.reply('open', (function (_this) {
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
            }
        }
    });
});
