App.module('Message', function (Message, App) {
    Message.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'wall/:id': 'wall',
            'dialog/:id': 'dialog'
        }
    });

    Message.channel = Backbone.Radio.channel('message');
    App.socket.on('message', function (message) {
        var model = new Message.Model(message);
        model.loadRelative().then(function () {
            Message.channel.request('message', model);
        });
    });

    Message.Model = Backbone.Model.extend({
        url: '/api/message',

        initialize: function () {
            resolveRelative(this, {
                source: App.User.Model,
                target: App.User.Model,
                owner: App.User.Model
            });

            if (!this.has('time')) {
                this.set('time', new Date().toISOString())
            }
        },

        loadRelative: function () {
            return loadRelative(this, {
                source: App.User.Model,
                target: App.User.Model,
                owner: App.User.Model
            });
        },

        isPost: function () {
            return !!this.get('owner');
        }
    });

    Message.List = App.PageableCollection.extend({
        url: '/api/message',

        queryModelInitial: {
            owner_id: null,
            target_id: null
        },

        model: function (attrs, options) {
            return new Message.Model(attrs, options);
        }
    });


    Message.DialogList = App.PageableCollection.extend({
        url: '/api/message/dialogs',

        queryModelInitial: {
            owner_id: null
        },

        model: function (attrs, options) {
            return new Message.Model(attrs, options);
        }
    });

    Message.PostView = Marionette.View.extend({
        template: '#layout-post',

        regions: {
            repost: '> .repost',
            photos: '> .photos',
            videos: '> .videos',
            childrenRegion: '> .children'
        },

        behaviors: {
            Bindings: {}
        },

        bindings: {
            '> .content .text': 'text'
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

    Message.EmptyView = Backbone.View.extend({
        render: function () {
            this.el.innerHTML = T('No messages');
        }
    });

    var listViewMixin = {
        behaviors: {
            Pageable: {}
        },

        animateLoading: function () {
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
        },

        getEmptyView: function () {
            return Message.EmptyView;
        }
    };

    Message.WallView = Marionette.CollectionView.extend({
        childView: Message.PostView,

        onRender: function () {
            this.animateLoading();
        }
    }, {
        widget: function (id) {
            var pageable = new Message.List();
            pageable.queryModel.set('type', 'wall');
            pageable.queryModel.set('owner_id', id);
            pageable.getFirstPage();
            return new Message.WallView({
                collection: pageable.fullCollection
            });
        }
    });

    _.extend(Message.WallView.prototype, listViewMixin);

    Message.View = Marionette.View.extend({
        template: '#view-message',

        behaviors: {
            Bindings: {}
        },

        bindings: {
            '.text': {
                observe: 'text',
                updateMethod: 'html',
                onGet: function (value) {
                    return value
                        .replace(/((ftp|https?):\/\/[^\s]+)/g, '<a href="$1" class="busy"></a>')
                        .replace(/\n/g, '<br/>')
                        .replace(/(п[оі]шел|[ийі]ди)\s+(нахуй)/ig, '$1 <a href="http://natribu.org/">$2</a>')
                        .replace(/(б[ыи]дл[оa]м?и?)/ig, ' <a href="http://lurkmore.to/%D0%91%D1%8B%D0%B4%D0%BB%D0%BE">$1</a>');
                }
            },
            '.time': {
                observe: 'time',
                onGet: function (value) {
                    return new Date(value).toLocaleTimeString();
                }
            }
        },

        onRender: function () {
            this.$el.addClass(this.model.get('source').get('_id') == App.user._id ? 'me' : 'other');
            if (!Message.View.lastAnimationStart) {
                Message.View.lastAnimationStart = Date.now();
            }
            Message.View.appearance.push(this);
            function appear() {
                setTimeout(function () {
                    var current = Message.View.appearance.pop();
                    if (current) {
                        current.$el.addClass('visible');
                        appear();
                    }
                }, 120)
            }

            if (Message.View.appearance.length <= 1) {
                appear();
            }
        }
    });

    Message.View.appearance = [];

    Message.ListView = Marionette.CollectionView.extend({
        childView: Message.View,

        onRender: function () {
            this.animateLoading();
        },

        attachHtml: function (collectionView, itemView, index) {
            if (this._isAttached) {
                var now = new Date(itemView.model.get('time'));
                if (index >= 1) {
                    var previousHour = new Date(collectionView.children.findByIndex(index - 1).model.get('time')).getHours();
                }
                if (index < 1 || now.getHours() < previousHour) {
                    $('<div></div>')
                        .html(now.toLocaleDateString())
                        .appendTo(collectionView.$el);
                }
            }
            itemView.$('a').each(function (i, anchor) {
                var image = new Image();
                anchor.setAttribute('target', '_black');
                image.addEventListener('load', function () {
                    anchor.classList.remove('busy');
                    anchor.classList.add('image');
                    anchor.appendChild(image);
                });
                image.addEventListener('error', function () {
                    anchor.classList.remove('busy');
                    var url = decodeURIComponent(anchor.href);
                    var origin = /\w+:\/\/([^\/]+)\//.exec(url);
                    var youtube = /youtube\.com\/.+v=([^&]+)/.exec(url);
                    if (youtube) {
                        App.local.getById('video', youtube[1]).then(function (oembed) {
                            $(anchor).replaceWith(
                                $(oembed.html)
                                    .removeAttr('width')
                                    .removeAttr('height')
                            );
                        });
                    }
                    else {
                        if (origin[1].indexOf('wikipedia.org') > 0) {
                            url = _.last(url.split('/')).replace(/_/g, ' ');
                        }
                        else if (url.length > 64) {
                            var remain = -64 + origin[1].length;
                            url = origin[1];
                            if (remain < 0) {
                                url += '/...' + anchor.href.slice(remain);
                            }
                        }
                        anchor.innerHTML = url;
                    }
                });
                image.classList.add('busy');
                image.src = anchor.href;
            });
            Marionette.CollectionView.prototype.attachHtml.apply(this, arguments);
        }
    });

    _.extend(Message.ListView.prototype, listViewMixin);


    Message.Dialog = Marionette.View.extend({
        template: '#layout-dialog',
        url: '/api/message',

        attributes: {
            'class': 'layout-dialog'
        },

        regions: {
            'list': '.list',
            'editor': '.editor'
        },

        ui: {
            'list': '.list',
            'editor': '.editor'
        },

        events: {
            'keyup .editor': 'resize'
        },

        queryModelInitial: {
            target_id: null
        },

        resize: function () {
            var text = this.getRegion('editor').currentView.ui.editor;
            var height = text.height();
            var scrollHeight = text[0].scrollHeight;
            if (height * 1.3 < scrollHeight) {
                text.css('min-height', '40vh');
            }
        },

        getCollection: function () {
            return this.getRegion('list').currentView.collection;
        },

        getQuery: function () {
            return this.getCollection().pageableCollection.queryModel;
        },

        initialize: function () {
            this.reply = _.bind(this.reply, this);
            this.send = _.bind(this.send, this);
            Message.channel.reply('message', this.reply);
            window.addEventListener('keyup', this.send);
        },

        destroy: function () {
            window.removeEventListener('keydown', this.send);
            Message.channel.stopReplying('message', this.reply);
        },

        reply: function (model) {
            var isReceiver = this.getQuery().get('target_id') == model.get('target').get('_id');
            if (isReceiver) {
                this.getCollection().add(model);
            }
            return isReceiver;
        },

        send: function (e) {
            if (e.altKey && 'Enter' == e.key) {
                this.getRegion('editor').currentView.send();
            }
        }
    }, {
        widget: function (region, options) {
            var list = new Message.List();
            list.queryModel.set('target_id', options.target_id);
            list.comparator = '_id';
            var listView = new Message.ListView({collection: list.fullCollection});
            var editor = new Message.Editor({
                model: new Message.Model({
                    target: options.target_id
                })
            });
            var dialog = new Message.Dialog();
            region.show(dialog);
            dialog.getRegion('list').show(listView);
            dialog.getRegion('editor').show(editor);
            list.getFirstPage();
            return dialog;
        }
    });

    Message.Emoji = Marionette.View.extend({
        template: '#view-empty',

        onRender: function () {
            var self = this;
            emoji.slice(0, 36).forEach(function (smile) {
                $('<span/>')
                    .html(smile)
                    .appendTo(self.$el)
                    .click(function () {
                        self.trigger('insert', this.innerHTML);
                    })
            });
        }
    });

    Message.Editor = Marionette.View.extend({
        template: '#layout-editor',

        behaviors: {
            Bindings: {}
        },

        bindings: {
            '.text': 'text'
        },

        ui: {
            editor: '.text'
        },

        regions: {
            editor: '.text',
            smiles: '.smiles',
            attachments: '.attachments',
            selection: '.selection'
        },

        events: {
            'click .smile': 'showSmiles',
            'click .send': 'send'
        },

        showSmiles: function () {
            var self = this;
            var emojiView = new Message.Emoji();
            emojiView.on('insert', function (smile) {
                var editor = self.ui.editor[0];
                editor.value = editor.value.slice(0, editor.selectionStart)
                    + smile + editor.value.slice(editor.selectionEnd);
                self.getRegion('smiles').empty();
            });
            this.getRegion('smiles').show(emojiView);
        },

        onRender: function () {
            if (!App.storage.load(this.model, 'target')) {
                this.ui.editor.one('click', function () {
                    this.innerHTML = '';
                });
            }
        },

        onDestroy: function () {
            if (this.model.get('text')) {
                App.storage.save(this.model, 'target');
            }
        },

        escape: function (value, options) {
            if (value) {
                value = value
                    .replace(/(&tab;|&nbsp;)+/ig, ' ')
                    .replace(/\s+/ig, ' ')
                    .replace(/<\w+\s*>([^<])<\/\w+>/ig, '')
                    .replace(/<br\s*\/>/ig, '\n')
                    .replace(/\s*\n+\s*/ig, '\n')
                    .trim();

            }
            return value;
        },

        send: function () {
            var self = this;
            var text = this.model.get('text');
            if (text) {
                this.model.save(null, {
                    success: function (model) {
                        model.loadRelative().then(function () {
                            Message.channel.request('message', model);
                            self.model = new Message.Model();
                            self.ui.editor[0].style.removeProperty('min-height');
                        });
                    }
                });
            }
        }
    });

    App.on('message', function (model) {
        throw new Error('Not impletemted');
    });

    return new Message.Router({
        controller: {
            wall: function (id) {
                var wall = Message.WallView.widget(id);
                wall.$el.addClass('scroll');
                return App.mainRegion.show(wall);
            },

            dialog: function (id) {
                if (_.isObjectID(id)) {
                    Message.Dialog.widget(App.getPlace('main'), {target_id: id});
                }
                else {
                    $.getJSON('/api/user?domain=' + id, function (user) {
                        Message.Dialog.widget(App.getPlace('main'), {target_id: user._id});
                    })
                }
            }
        }
    });
});
