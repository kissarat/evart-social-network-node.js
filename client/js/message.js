"use strict";

App.module('Message', function (Message, App) {
    Message.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'wall/:id': 'wall',
            'dialog/:id': 'dialog',
            'dialogs': 'dialogs'
        }
    });

    Message.channel = Backbone.Radio.channel('message');
    App.socket.on(MessageType.DIALOG, function (message) {
        var model = new Message.Model(message);
        model.loadRelative().then(function () {
            if (!Message.channel.request('dialog', model)) {
                Message.notify(model);
            }
        });
    });
    App.socket.on('read', function (message) {
        Message.channel.request('read', message.ids);
    });

    Message.notify = function (model) {
        if (!(model instanceof Message.Model)) {
            model = new Message.Model(model);
        }
        return model.loadRelative().then(function () {
            var source = model.get('source');
            // if (!isFirefox) {
            // sound(model.get('sound') ? model.get('sound') : 'notification');
            // }
            return App.notify({
                tag: model.get('_id'),
                icon: source.getAvatarURL(),
                title: source.getName(),
                body: model.get('text'),
                timeout: model.get('timeout'),
                silent: true
            });
        });
    };

    Message.Model = Backbone.Model.extend({
        url: '/api/message',
        cidPrefix: 'msg',

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
        },

        getPeer: function () {
            return App.user._id === this.get('source').get('_id')
                ? this.get('target') : this.get('source');
        }
    });

    Message.LastMessage = Backbone.Model.extend({
        initialize: function () {
            resolveRelative(this, {
                peer: App.User.Model
            });
        }
    });

    Message.List = App.PageableCollection.extend({
        url: '/api/message',

        queryModelInitial: {
            type: 0,
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
            type: 'dialog',
            cut: 140,
            unread: 0
        },

        model: function (attrs, options) {
            return new Message.LastMessage(attrs, options);
        }
    });

    Message.LastMessageView = Marionette.View.extend({
        template: '#view-last-message',

        bindings: {
            '.text': 'text',
            '.time': {
                observe: 'time',
                onGet: function (value) {
                    // return moment(value).format('YY-MM-DD HH:mm');
                    return _.passed(value);
                }
            }
        },

        ui: {
            unread: '.unread',
            peer_name: '.peer .name',
            peer_avatar: '.peer .avatar',
            time: '.peer .time',
            source_name: '.source .name',
            source_avatar: '.source .avatar'
        },

        events: {
            'click .content': 'openDialog',
            'click .peer': 'openPeer'
        },

        attributes: {
            'class': 'view last-message'
        },

        openDialog: function () {
            App.navigate('/dialog/' + this.model.get('peer').get('domain'));
        },

        openPeer: function () {
            App.navigate('/view/' + this.model.get('peer').get('domain'));
        },

        onRender: function () {
            var ui = this.ui;
            var peer = this.model.get('peer');
            ui.peer_name.html(peer.getName());
            peer.setupAvatar(ui.peer_avatar);
            if (App.user._id == peer.get('_id')) {
                this.$el.addClass('mine');
                new User.Model(App.user).setupAvatar(ui.source_avatar);
            }
            var unread = this.model.get('unread');
            if (unread > 0) {
                this.$el.addClass('unread');
                if (unread > 1) {
                    this.ui.unread.html(unread);
                }
            }
            var online = new Date(peer.get('online')).getTime();
            if (online >= Date.now()) {
                this.$el.addClass('online');
            }
            this.stickit();
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

        onRender: function () {
            var source = this.model.get('source');
            this.ui.name.attr('href', '/view/' + source.get('domain'));
            this.ui.name.html(source.getName());
            this.$el.attr('data-id', this.model.get('_id'));
            this.ui.info.attr('data-id', source.get('_id'));
            source.setupAvatar(this.ui.avatar[0]);
            if (source.get('_id') === App.user._id) {
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
            this.ui.time.html(_.passed(this.model.get('time')));
            if (this.model.get('isRepost')) {
                this.ui.controls.remove();
            } else {
                this.renderLikes();
            }
        }
    });

    Message.EmptyView = Backbone.View.extend({
        render: function () {
            this.el.innerHTML = T('No messages');
        }
    });

    var listViewMixin = {
        animateLoading: function () {
            var self = this;
            var loading = false;
            register(this.collection.pageableCollection, {
                start: function () {
                    if (!loading) {
                        loading = self.$el.append($('#view-bounce').html());
                    }
                },

                finish: function () {
                    if (loading) {
                        loading.remove();
                        loading = false;
                    }
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
        widget: function (region, options) {
            var pageable = new Message.List();
            pageable.queryModel.set('type', MessageType.WALL);
            pageable.queryModel.set('owner_id', options.owner_id);
            pageable.getFirstPage();
            var wall = new Message.WallView({
                collection: pageable.fullCollection
            });
            region.show(wall);
            return wall;
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
            var source = this.model.get('source');
            this.$el.addClass(source == App.user._id ? 'me' : 'other');
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
                }, 120);
            }

            if (Message.View.appearance.length <= 1) {
                appear();
            }

            if (this.model.get('unread') > 0) {
                this.$el.addClass('unread');
                var self = this;
                this.model.on('change:unread', function () {
                    self.$el.removeClass('unread');
                })
            }
        }
    });

    Message.View.appearance = [];
    function attachHtml(collectionView, itemView, index) {
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

    Message.ListView = Marionette.CollectionView.extend({
        childView: Message.View,

        onRender: function () {
            this.animateLoading();
        },

        attachHtml: attachHtml
    });

    _.extend(Message.ListView.prototype, listViewMixin);

    Message.DialogListView = Marionette.CollectionView.extend({
        childView: Message.View,

        behaviours: {
            // Pageable: {reverse: true}
        },

        onRender: function () {
            this.animateLoading();
        },

        attachHtml: attachHtml
    }, {
        widget: function (region, options) {
            var list = new Message.DialogList();
            list.queryModel.set(_.pick(options, 'unread', 'cut', 'since'));
            var listView = new Message.DialogListView({collection: list.fullCollection});
            region.show(listView);
            list.getFirstPage();
            return listView;
        }
    });

    _.extend(Message.DialogListView.prototype, listViewMixin);

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
            this.read = _.bind(this.read, this);
            Message.channel.reply('dialog', this.reply);
            Message.channel.reply('read', this.read);
            window.addEventListener('keyup', this.send);
            this.send = _.bind(this.send, this);
        },

        destroy: function () {
            window.removeEventListener('keyup', this.send);
            Message.channel.stopReplying('read', this.read);
            Message.channel.stopReplying('dialog', this.reply);
        },

        reply: function (model) {
            var self = this;
            var id = model.get('source').get('_id');
            var isReceiver = this.getQuery().get('target_id') === id;

            function read() {
                setTimeout(function () {
                    self.read(id)
                }, _.random(800, 1600));
                document.removeEventListener('visibilitychange', read);
            }

            if (isReceiver) {
                this.getCollection().add(model);
                if ('visible' === document.visibilityState) {
                    read();
                }
                else {
                    document.addEventListener('visibilitychange', read);
                }
            }
            return isReceiver;
        },

        read: function (ids) {
            var count = 0;
            this.getCollection().forEach(function (model) {
                if (ids.indexOf(model.get('_id')) >= 0) {
                    model.set('unread', 0);
                    count++;
                }
            });
            return count;
        },

        send: function (e) {
            if (e.altKey && 'Enter' == e.key) {
                this.getRegion('editor').currentView.send();
            }
        }
    }, {
        widget: function (region, options) {
            var list = new Message.List();
            if (!options.type) {
                options.type = MessageType.DIALOG;
            }
            list.queryModel.set('type', options.type);
            list.queryModel.set('target_id', options.target_id);
            list.comparator = '_id';
            var listView = new Message.DialogListView({collection: list.fullCollection});
            var draft = {
                type: options.type,
                target: options.target_id
            };
            if (options.source) {
                draft.source = options.source;
            }
            var editor = new Message.Editor({
                model: new Message.Model(draft)
            });
            var dialog = new Message.Dialog();
            region.show(dialog);
            dialog.getRegion('list').show(listView);
            dialog.getRegion('editor').show(editor);
            list.getFirstPage();
            setTimeout(function () {
                // var hasUnread = _.some(list.fullCollection.models, function (model) {
                //     return model.get('unread')
                // });
                // if (hasUnread) {
                $.getJSON('/api/message/read?dialog_id=' + options.target_id, dialog.read);
                // }
            }, _.random(600, 3000));
            return dialog;
        }
    });

    Message.Emoji = Marionette.View.extend({
        template: '#view-empty',

        onRender: function () {
            var self = this;
            _.each(emoji, function (info, smile) {
                smile = $('<span/>')
                    .attr('title', T(info[1]) + ' ' + info[0])
                    .html(smile)
                    .click(function () {
                        self.trigger('insert', this.innerHTML);
                    });
                self.$el.append(smile);
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

        send: function () {
            var self = this;
            var text = this.model.get('text');
            if (text) {
                text = text.replace(/:[a-z_]+:/g, function (match) {
                    for (var symbol in emoji) {
                        var info = emoji[symbol];
                        if (match == info[0]) {
                            return symbol;
                        }
                    }
                });
                this.model.save('text', text, {
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

    return new Message.Router({
        controller: {
            wall: function (id) {
                var wall = Message.WallView.widget(App.getPlace('main'), {owner_id: id});
                wall.$el.addClass('scroll');
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
            },

            dialogs: function () {
                Message.DialogListView.widget(App.getPlace('main'), {cut: 140});
            }
        }
    });
});
