'use strict';

App.module('Video', function (Video, App) {
    Video.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'video': 'index',
            'user/video/:id': 'index'
        }
    });

    Video.channel = Backbone.Radio.channel('video');

    Video.List = App.PageableCollection.extend({
        url: '/api/video',
        cidPrefix: 'vdl',

        query: {
            type: 'video',
            owner_id: null,
            q: ''
        }
    });

    Video.Thumbnail = Marionette.View.extend({
        template: '#thumbnail-video',
        tagName: 'a',
        cidPrefix: 'vdt',

        ui: {
            image: 'img',
            title: 'figcaption'
        },

        events: {
            'click': 'open'
        },

        bindings: {
            'figcaption': 'title'
        },

        behaviors: {
            Bindings: {}
        },

        open: function (e) {
            e.preventDefault();
            return Video.channel.request('open', this.model);
        },

        onRender: function () {
            this.ui.image.attr('src', this.model.get('thumbnail_url'));
            this.ui.image.attr('alt', this.model.get('title'));
            return this.$el.attr('href', '/video/' + this.model.get('_id'));
        }
    });

    Video.ListView = Marionette.CollectionView.extend({
        childView: Video.Thumbnail,
        cidPrefix: 'vdlv',

        behaviors: {
            Pageable: {}
        }
    });

    Video.View = Marionette.View.extend({
        template: '#view-video',
        cidPrefix: 'vdov',

        initialize: function () {
            var self = this;
            this.model = new Backbone.Model();
            return Video.channel.reply('open', function (model) {
                self.model = model;
                self.ui.frame.html(model.get('html'));
            });
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

    Video.Layout = Marionette.View.extend({
        template: '#layout-video-list',
        cidPrefix: 'vdos',

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
            var self = this;
            if (EmptyKeys.indexOf(e.key) < 0) {
                this.ui.list.busy(true);
                return this.getCollection().delaySearch(function () {
                    return self.ui.list.busy(false);
                });
            }
        }

    }, {
        widget: function (region, options) {
            var list = new Video.List([], {
                query: _.pick(options, 'owner_id')
            });
            var layout = new Video.Layout();
            region.show(layout);
            var listView = new Video.ListView({
                collection: list.fullCollection
            });
            layout.getRegion('current').show(new Video.View());
            layout.getRegion('list').show(listView);
            list.getFirstPage();
            return layout;
        }
    });

    return new Video.Router({
        controller: {
            index: function (owner_id) {
                return Video.Layout.widget(App.getPlace('main'), {
                    owner_id: owner_id
                });
            }
        }
    });
});
