App.module('Message', function (Message, App) {
    Message.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'wall/:id': 'wall'
        }
    });

    Message.Model = Backbone.Model.extend({
        initialize: function () {
            var value = this.get('source');
            if ('object' == typeof value) {
                this.set('source', new App.User.Model(value));
            }
            value = this.get('target');
            if ('object' == typeof value) {
                this.set('target', new App.User.Model(value));
            }
        },

        isPost: function () {
            return !!this.get('owner');
        }
    });

    Message.List = App.PageableCollection.extend({
        url: '/api-cache/message',

        queryModelInitial: {
            owner_id: null
        },

        model: function (attrs, options) {
            return new Message.Model(attrs, options);
        }
    });

    Message.View = Marionette.View.extend({
        template: '#layout-message',

        regions: {
            repost: '> .repost',
            photos: '> .photos',
            videos: '> .videos',
            childrenRegion: '> .children'
        },

        behaviors: {
            Bindings: {}
        },

        ui: {
            name: '> .content .name',
            content: '> .content',
            info: '> .content .info',
            avatar: '> .content .avatar',
            time: '> .content .time',
            text: '> .content .text',
            controls: '> .message-controls',
            likeSlider: '> .message-controls .like-slider-container',
            like: '> .message-controls .fa-thumbs-up',
            hate: '> .message-controls .fa-thumbs-down',
            comment: '> .message-controls .comment'
        },

        events: {
            'click > .message-controls .fa-thumbs-up': 'like',
            'click > .message-controls .fa-thumbs-down': 'hate',
            'click > .message-controls .fa-share-alt': 'share',
            'click > .message-controls .comment': 'renderComments',
            'click > .message-controls .like-slider-container': 'sliderClick'
        },

        bindings: {
            '> .content .text': 'text'
        },

        setAvatar: function (id) {
            return this.ui.avatar[0].setBackground(App.avatarUrl(id));
        },

        sliderClick: function (e) {
            var rect, s, x;
            s = this.ui.likeSlider;
            rect = s[0].getBoundingClientRect();
            x = e.clientX - rect.left;
            s.toggleClass('like', x > 24);
            return s.toggleClass('hate', x < 12);
        },

        like: function () {
            return this._like('like');
        },

        hate: function () {
            return this._like('hate');
        },

        _like: function (field) {
            return $.ajax({
                type: _.indexOf(this.model.get(field), App.user._id) >= 0 ? 'DELETE' : 'POST',
                url: '/api/like?' + $.param({
                    entity: 'messages',
                    field: field,
                    id: this.model.get('_id')
                }),
                success: (function (_this) {
                    return function (data) {
                        _this.model.set('like', data.like);
                        _this.model.set('hate', data.hate);
                        return _this.renderLikes();
                    };
                })(this)
            });
        },

        renderLikes: function () {
            this.ui.like.html(_.size(this.model.get('like')));
            this.ui.hate.html(_.size(this.model.get('hate')));
        },

        share: function () {
            return $.post('/api/message?repost_id=' + this.model.get('_id'));
        },

        renderComments: function () {
            var childrenView;
            this.ui.comment.remove();
            childrenView = new App.Layouts.Thresome();
            this.showChildView('childrenRegion', childrenView);
            return App.Views.Dialog.build(this.model.get('_id'), this.model.getChildren(), childrenView);
        },

        renderRepost: function () {
            var repost, repostView;
            repost = this.model.get('repost');
            if (repost) {
                repost = new App.Models.Message(repost);
                repost.set('isRepost', true);
                repostView = new Layouts.MessageLayout({
                    model: repost
                });
                return this.repost.show(repostView);
            }
        },

        renderPhotos: function () {
            var photos;
            if (_.size(this.model.get('photos')) > 0) {
                photos = App.Views.PhotoList.create(this.model.get('photos'));
                this.photos.show(photos);
                return photos.on('childview:select', function (photo) {
                    return App.navigate('photo/' + photo.model.get('_id'));
                });
            }
        },

        renderVideos: function () {
            var videos;
            if (_.size(this.model.get('videos')) > 0) {
                videos = App.Views.VideoList.create(this.model.get('videos'));
                videos.on('childview:select', function (video) {
                    return App.navigate('video/' + video.model.get('_id'));
                });
                return this.videos.show(videos);
            }
        },

        onRender: function () {
            var source, source_id;
            source = this.model.get('source');
            this.ui.name.attr('href', '/view/' + source.get('domain'));
            this.ui.name.html(source.getName());
            this.$el.attr('data-id', this.model.get('_id'));
            source_id = App.id(this.model.get('source'));
            this.ui.info.attr('data-id', source_id);
            if (source_id) {
                this.setAvatar(source_id);
            }
            if (source_id === App.user._id) {
                this.$el.addClass('me');
                $('<div class="fa fa-times"></div>').appendTo(this.ui.controls).click((function (_this) {
                    return function () {
                        return $.ajax({
                            url: '/api/message?id=' + _this.model.get('_id'),
                            type: 'DELETE',
                            success: function () {
                                return _this.el.remove();
                            }
                        });
                    };
                })(this));
            }
            if (this.model.get('unread')) {
                this.$el.addClass('unread');
            }
            this.ui.time.html(moment.utc(this.model.get('time')).fromNow());
            if (this.model.get('isRepost')) {
                this.ui.controls.remove();
            } else {
                this.renderLikes();
            }
            this.renderPhotos();
            this.renderVideos();
            this.renderRepost();
            if (_.size(this.model.get('children')) > 0) {
                this.renderComments();
                this.ui.comment.remove();
            }
        }
    });

    Message.ListView = Marionette.CollectionView.extend({
        childView: Message.View,

        behaviors: {
            Pageable: {}
        },

        onRender: function () {
            var loading;
            this.collection.pageableCollection.on('start', (function (_this) {
                return function () {
                    if (!loading) {
                        return loading = $($('#view-bounce').html()).appendTo(_this.$el);
                    }
                };
            })(this));
            return this.collection.pageableCollection.on('finish', function () {
                if (loading) {
                    loading.remove();
                    loading = null;
                }
            });
        }
    }, {
        wall: function (id) {
            var pageable = new Message.List();
            pageable.queryModel.set('type', 'wall');
            pageable.queryModel.set('owner_id', id);
            pageable.getFirstPage();
            return new Message.ListView({
                collection: pageable.fullCollection
            });
        }
    });

    Message.Editor = Marionette.View.extend({
        template: '#layout-editor',

        regions: {
            editor: '.editor',
            buttons: '.buttons',
            attachments: '.attachments',
            photos: 'div[data-list=photos]',
            videos: 'div[data-list=videos]',
            files: 'div[data-list=files]',
            selection: '.selection'
        },

        events: {
            'click [data-type=photo]': 'selectPhoto',
            'click [data-type=video]': 'selectVideo',
            'click [type=submit]': 'submit'
        }
    });

    return new Message.Router({
        controller: {
            wall: function (id) {
                var wall = Message.ListView.wall(id);
                wall.$el.addClass('scroll');
                return App.mainRegion.show(wall);
            }
        }
    });
});
