"use strict";

App.module('Message', function (Message, App) {
    Message.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'wall/:id': 'wall',
            'news': 'news',
            'dialog/:id': 'dialog',
            'dialogs': 'dialog',
            'emoji': 'emoji'
        }
    });

    Message.channel = Backbone.Radio.channel('message');

    [MessageType.CHAT, MessageType.DIALOG, MessageType.WALL, MessageType.COMMENT].forEach(function (type) {
        App.socket.on(type, function (message) {
            var model = new Message.Model(message);
            model.loadRelative().then(function () {
                if (!Message.channel.request(type, model)) {
                    Message.notify(model);
                    Message.getDialogList().pageableCollection.replaceMessage(model);
                }
            });
        });
    });

    App.socket.on('read', function (message) {
        Message.channel.request('read', message);
    });

    Message.notify = function (model) {
        if (!(model instanceof Message.Model)) {
            model = new Message.Model(model);
        }
        return model.loadRelative().then(function () {
            var source = model.get('source');
            return App.notify({
                tag: model.id,
                icon: source.getAvatarURL(),
                title: source.getName(),
                body: model.get('text'),
                timeout: model.get('timeout'),
                silent: true,
                url: 'dialog/' + model.id
            });
        });
    };

    Message.Model = Backbone.Model.extend({
        cidPrefix: 'msg',
        idAttribute: '_id',

        url: function () {
            return this.isNew() ? '/api/message' : '/api/message?id=' + this.get('_id');
        },

        initialize: function () {
            var self = this;
            resolveRelative(this, Message.Model.relatives);

            if (!this.has('time')) {
                this.set('time', new Date().toISOString());
            }

            if (isNaN(this.get('unread'))) {
                this.set('unread', 0);
            }

            ['like', 'hate'].forEach(function (name) {
                if (!self.has(name)) {
                    self.set(name, []);
                }
            });
        },

        toString: function () {
            return JSON.stringify(this.attributes);
        },

        like: function (user_id) {
            return this.get('like').indexOf(user_id || App.user._id) >= 0;
        },

        hate: function (user_id) {
            return this.get('hate').indexOf(user_id || App.user._id) >= 0;
        },

        getAttitude: function (user_id) {
            if (this.like(user_id)) {
                return 'like';
            }
            if (this.hate(user_id)) {
                return 'hate';
            }
            return false
        },

        loadRelative: function () {
            return loadRelative(this, Message.Model.relatives);
        },

        isPost: function () {
            return !!this.get('owner');
        },

        getPeer: function () {
            return App.user._id === this.get('source').get('_id')
                ? this.get('target') : this.get('source');
        },

        isMine: function () {
            return this.get('source').get('_id') === App.user._id;
        },

        passed: function () {
            return _.passed(this.get('time'));
        },

        getTime: function () {
            return new Date(this.get('time')).getTime();
        },

        getIndex: function () {
            return parseInt(this.get('_id').slice(2), 16);
        },

        cloneDraft: function () {
            var model = this.clone();
            ['_id', 'text', 'time', 'like', 'hate', 'unread'].forEach(function (name) {
                model.unset(name);
            });
            model.set('files', new App.File.List());
            return model;
        },

        toLastMessage: function () {
            var id = MessageType.CHAT === this.get('type')
                ? this.get('chat').id
                : this.get('source').get('_id');

            var lastMessage = new Message.LastMessage({
                _id: id,
                type: this.get('type'),
                text: this.get('text'),
                source: this.get('source')
            });

            if (MessageType.CHAT === this.get('type')) {
                lastMessage.set('chat', this.get('chat'));
            }
            else {
                var source = id === App.user._id ? id : this.get('source');
                lastMessage.set('peer', source);
            }
            return lastMessage;
        }
    }, {
        tableName: 'message'
    });

    Message.Chat = Backbone.Model.extend({
        idAttribute: '_id',

        url: function () {
            return '/api/chat?id=' + this.id;
        },

        getName: function () {
            return this.get('name') || this.id;
        },

        isAdmin: function (user_id) {
            if (!user_id) {
                user_id = App.user._id;
            }
            return this.get('admin').indexOf(user_id) >= 0;
        }
    }, {
        tableName: 'chat'
    });

    Message.Model.relatives = {
        source: App.User.Model,
        target: App.User.Model,
        owner: App.User.Model,
        parent: Message.Model,
        files: App.File.List,
        chat: Message.Chat
    };

    Message.LastMessage = Backbone.Model.extend({
        idAttribute: '_id',

        initialize: function () {
            resolveRelative(this, Message.LastMessage.relatives);
        },

        getPeer: function () {
            return 'chat' === this.get('type') ? this.get('chat') : this.get('peer');
        },

        getIndex: function () {
            return new Date(this.get('time')).getTime();
        },

        loadRelative: function () {
            return loadRelative(this, Message.LastMessage.relatives);
        }
    });

    Message.LastMessage.relatives = {
        peer: App.User.Model,
        chat: Message.Chat
    };

    Message.List = App.PageableCollection.extend({
        url: '/api/message',

        query: {
            type: 0,
            limit: 25
        },

        model: function (attrs, options) {
            return new Message.Model(attrs, options);
        }
    });

    Message.comparator = function (a, b) {
        return b.getIndex() - a.getIndex();
    };

    Message.DialogList = App.PageableCollection.extend({
        url: '/api/message/dialogs',

        query: {
            q: ''
        },

        initialize: function (options) {
            App.PageableCollection.prototype.initialize.call(this, options);
            this.comparator = Message.comparator;
        },

        model: function (attrs, options) {
            return new Message.LastMessage(attrs, options);
        },

        getById: function () {

        },

        parseRecords: function (records) {
            records.forEach(function (record) {
                if (record.text.length > App.config.message.cut) {
                    record.text = record.text.slice(0, App.config.message.cut) + '…';
                }
            });
            return App.PageableCollection.prototype.parseRecords.call(this, records);
        },

        replaceMessage: function (message) {
            var self = this;

            function replace() {
                var lastMessage = Message.getDialogList().find(function (current) {
                    return current.id === message.id
                });
                if (lastMessage) {
                    self.remove(lastMessage);
                }
                else {
                    console.log('Message with ID not found');
                }
                self.add(message);
                self.sort();
            }

            if (MessageType.DIALOG === message.get('type') || MessageType.CHAT === message.get('type')) {
                if (message instanceof Message.Model) {
                    message = message.toLastMessage();
                    message.loadRelative().then(replace);
                }
                else {
                    replace();
                }
            }
        }
    });

    Message.getDialogList = function () {
        if (!this.dialogList) {
            var dialogList = new Message.DialogList([], {
                query: {
                    id: App.user._id
                }
            });
            dialogList.comparator = Message.comparator;
            // setImmediate(function () {
            //     dialogList.getFirstPage();
            // });
            dialogList.getFirstPage();
            this.dialogList = dialogList.fullCollection;
        }
        this.dialogList.on('add', function (model) {
            if (model.has('chat')) {
                App.local.put('chat', model.get('chat'));
            }
            if (model.has('peer')) {
                App.local.put('user', model.get('peer'));
            }
        });
        return this.dialogList;
    };

    Message.LastMessageView = Marionette.View.extend({
        template: '#view-last-message',

        bindings: {
            '.text': {
                observe: 'text',
                updateMethod: 'html'
            },
            '.time': {
                observe: 'time',
                onGet: function (value) {
                    return _.passed(value);
                }
            }
        },

        ui: {
            unread: '.unread',
            peer_name: '.name',
            peer_avatar: '.avatar',
            time: '.time'
        },

        events: {
            'click': 'openDialog',
            'click .peer': 'openPeer'
        },

        attributes: {
            'class': 'view last-message'
        },

        modelEvents: {
            'change:unread': function (model, unread) {
                this.$el.toggleClass('unread', unread);
                this.ui.unread.html(unread > 1 ? unread : '');
            }
        },

        openDialog: function () {
            var id = 'dialog' === this.model.get('type')
                ? this.model.get('peer').get('domain')
                : this.model.get('_id');
            App.navigate('dialog/' + id);
        },

        openPeer: function () {
            if (this.model.has('peer')) {
                App.navigate('/view/' + this.model.get('peer').get('domain'));
            }
        },

        onRender: function () {
            var ui = this.ui;
            var peer = this.model.getPeer();
            ui.peer_name.html(peer.getName());
            if (peer.setupAvatar instanceof Function) {
                peer.setupAvatar(ui.peer_avatar);
            }
            if (peer.has('online')) {
                var online = new Date(peer.get('online')).getTime();
                if (online >= Date.now()) {
                    this.$el.addClass('online');
                }
            }
            this.stickit();
        }
    });

    Message.PostView = Marionette.View.extend({
        template: '#view-post',

        regions: {
            files: '> .content .files',
            repost: '> .repost',
            children: '> .children'
        },

        attributes: {
            'class': 'view post'
        },

        bindings: {
            '> .content .text': 'text'
        },

        ui: {
            content: '> .content',
            attitude: '> .controls > .attitude',
            name: '> .content .name',
            info: '> .content > .info',
            avatar: '> .content > .info .avatar',
            time: '> .content > .info .time',
            text: '> .content > .message > .text',
            controls: '> .controls',
            commentButton: '> .controls .comment',
            repostButton: '> .controls .repost',
            removeButton: '> .controls .remove',
            children: '> .children'
        },

        events: {
            'click > .controls .fa-share-alt': 'share',
            'click > .content .name': 'view',
            'click > .controls > .attitude > *': 'estimate',
            'click > .controls > .remove': 'remove',
            'click > .controls > .comment': 'comment'
        },

        comment: function () {
            this.ui.children.toggle('hidden');
            if (!this.getRegion('children').currentView) {
                Message.CommentLayout.widget(this.getRegion('children'), {id: this.model.id});
            }
        },

        view: function (e) {
            e.preventDefault();
            if (location.pathname != this.ui.name.attr('href')) {
                App.navigate(this.ui.name.attr('href'));
            }
        },

        remove: function () {
            this.model.destroy({wait: true});
        },

        estimate: function (e) {
            var self = this;
            var params = {
                entity: 'message',
                id: this.model.get('_id'),
                name: e.target.getAttribute('data-name')
            };
            $.ajax({
                type: params.name ? 'POST' : 'DELETE',
                url: '/api/attitude?' + $.param(params),
                success: function () {
                    self.ui.attitude.attr('data-attitude', params.name);
                }
            })
        },

        initialize: function () {
            assert.isInstance(this.model.get('files'), App.File.List);
            assert.isInstance(this.model.get('source'), App.User.Model);
        },

        renderFiles: function () {
            this.getRegion('files').show(new App.File.AttachmentListView({
                collection: this.model.get('files')
            }))
        },

        onRender: function () {
            this.ui.name.attr('href', '/view/' + this.model.get('source').get('domain'));
            this.ui.name.html(this.model.get('source').getName());
            this.model.get('source').setupAvatar(this.ui.avatar[0]);
            this.$el.addClass(this.model.isMine() ? 'mine' : 'other');
            if (this.model.get('unread')) {
                this.$el.addClass('unread');
            }
            var attitude = this.model.getAttitude();
            if (attitude) {
                this.el.querySelector('.attitude').dataset.attitude = attitude;
            }
            this.$el.addClass(this.model.get('source').getSex());
            this.ui.time.html(this.model.passed());
            if (App.config.message.repost) {
                this.ui.repostButton.removeClass('hidden');
            }
            if (App.config.message.comment) {
                this.ui.commentButton.removeClass('hidden');
            }
            /*
             var model = this.model.has('parent') ? this.model.get('parent') : this.model;
             model.loadRelative().then(function () {
             var canRemove = App.config.message.remove &&
             (model.get('owner').canManage() || model.get('source').canManage());
             if (canRemove) {
             self.ui.removeButton.removeClass('hidden');
             }
             });
             */
            this.stickit();
            this.renderFiles();
        }
    });

    Message.EmptyView = Backbone.View.extend({
        render: function () {
            this.el.innerHTML = T('No messages');
        }
    });

    var listViewMixin = {
        animateLoading: function (model) {
            var self = this;
            if (!model) {
                model = new Backbone.Model()
            }
            register(this.collection.pageableCollection, {
                start: function () {
                    if (!model.loading) {
                        self.animation = $('<img/>').attr('src', '/svg/process.svg');
                        self.$el.append(self.loading);
                    }
                },

                finish: function () {
                    if (self.loading) {
                        self.animation.remove();
                    }
                }
            });
        },

        getEmptyView: function () {
            return Message.EmptyView;
        }
    };

    Message.PostListView = Marionette.CollectionView.extend({
        childView: Message.PostView,

        initialize: function () {
            this.reply = this.reply.bind(this);
            this.collection.comparator = Message.comparator;
        },

        onRender: function () {
            Message.channel.reply(MessageType.WALL, this.reply);
            this.animateLoading();
        },

        onDestroy: function () {
            Message.channel.stopReplying(MessageType.WALL, this.reply);
        },

        reply: function (model) {
            if (model instanceof Backbone.Model) {
                this.collection.add(model);
                this.collection.sort();
            }
            else {
                console.error('Invalid object', model);
            }
        }
    }, {
        widget: function (region, options) {
            var query = _.merge({
                type: MessageType.WALL,
                owner_id: options.id,
                user: 'source.owner',
                file: 'files',
                select: 'like.hate.files.videos.sex.text.admin',
                sort: '-_id'
            }, _.pick(options, 'user', 'select', 'type'));
            var pageable = new Message.List([], {query: query});
            var postListView = new Message.PostListView({
                collection: pageable.fullCollection
            });
            region.show(postListView);
            pageable.getFirstPage();
            return postListView;
        }
    });

    _.extend(Message.PostListView.prototype, listViewMixin);

    Message.WallView = Marionette.View.extend({
        template: '#view-wall',

        attributes: {
            class: 'view wall'
        },

        regions: {
            editor: '.editor',
            list: '.list'
        }
    }, {
        widget: function (region, options) {
            var wallView = new Message.WallView();
            region.show(wallView);
            var editor = new Message.Editor({
                model: new Message.Model({
                    type: MessageType.WALL,
                    owner: options.owner
                })
            });
            wallView.getRegion('editor').show(editor);
            Message.PostListView.widget(wallView.getRegion('list'), options);
            return wallView;
        }
    });

    Message.CommentList = Backbone.Collection.extend({
        initialize: function (models, options) {
            _.defaults(this, options);
        },

        url: function () {
            return '/api/message?' + $.param(_.merge(this.query, {
                    type: MessageType.COMMENT,
                    select: 'like.hate.files.videos.sex.text.parent.source',
                    user: 'source',
                    message: 'parent'
                }));
        },

        model: function (attrs, options) {
            return new Message.Model(attrs, options);
        }
    });

    Message.CommentListView = Marionette.CollectionView.extend({
        childView: Message.PostView,

        initialize: function () {
            this.reply = this.reply.bind(this);
            Message.channel.reply(Message.COMMENT, this.reply);
            this.collection.comparator = Message.comparator;
        },

        onDestroy: function () {
            Message.channel.stopReplying(Message.COMMENT, this.reply);
        },

        reply: function (model) {
            if (model instanceof Message.Model) {
                // if (this.collection.pageableCollection.queryModel.get('parent_id') == model.get('parent').id) {
                this.collection.add(model);
                this.collection.sort();
                // }
            }
            else {
                console.error('Invalid object', model);
            }
        }
    }, {
        widget: function (region, options) {
            var list = new Message.CommentList([], {query: _.pick(options, 'id')});
            var listView = new Message.CommentListView({
                collection: list
            });
            region.show(listView);
            list.fetch();
            return listView;
        }
    });

    Message.CommentLayout = Marionette.View.extend({
        template: '#layout-comment',

        attributes: {
            class: 'layout comment'
        },

        regions: {
            editor: '.editor',
            list: '.list'
        }
    }, {
        widget: function (region, options) {
            var commentLayout = new Message.CommentLayout();
            region.show(commentLayout);
            var editor = new Message.Editor({
                model: new Message.Model({
                    type: MessageType.COMMENT,
                    parent: options.id
                })
            });
            commentLayout.getRegion('editor').show(editor);
            Message.CommentListView.widget(commentLayout.getRegion('list'), options);
            return commentLayout;
        }
    });

    Message.View = Marionette.View.extend({
        template: '#view-message',

        ui: {
            avatar: '.avatar',
            name: '.name'
        },

        attributes: {
            'class': 'view message'
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
                    value = new Date(value);
                    return App.config.message.date ? value.toLocaleString() : value.toLocaleTimeString();
                }
            }
        },

        appear: function appear() {
            var self = this;
            setTimeout(function () {
                var current = Message.View.appearance.pop();
                if (current) {
                    current.$el.addClass('visible');
                    self.appear();
                }
            }, 120);
        },

        onRender: function () {
            var self = this;
            var source = this.model.get('source');
            this.$el.addClass(this.model.isMine() ? 'mine' : 'other');
            this.$el.attr('data-id', this.model.get('_id'));
            this.$el.attr('data-source', source.get('domain'));
            source.setupAvatar(this.ui.avatar[0]);
            this.ui.name.html(source.getName());
            if (App.config.message.appearance) {
                if (!Message.View.lastAnimationStart) {
                    Message.View.lastAnimationStart = Date.now();
                }
                Message.View.appearance.push(this);

                if (Message.View.appearance.length <= 1) {
                    this.appear();
                }
            }
            else {
                this.$el.addClass('visible');
            }

            if (this.model.get('unread') > 0) {
                this.$el.addClass('unread');
                this.model.on('change:unread', function () {
                    self.$el.removeClass('unread');
                })
            }
            this.stickit();
        }
    });

    Message.View.appearance = [];

    function attachHtml(collectionView, itemView, index) {
        if (App.config.message.substitute) {
            if (this._isAttached && !App.config.message.date) {
                var now = new Date(itemView.model.get('time'));
                if (index >= 1) {
                    var time = collectionView.children.findByIndex(index - 1).model.get('time');
                    var previousHour = new Date(time).getHours();
                }
                if (index < 1 || now.getHours() < previousHour) {
                    var day = $tag('div', null, now.toLocaleDateString());
                    collectionView.el.appendChild(day);
                }
            }
            itemView.$('a').each(function (i, anchor) {
                anchor.setAttribute('target', '_black');
                var image = new Image();
                image.register({
                    load: function () {
                        anchor.classList.remove('busy');
                        anchor.classList.add('image');
                        anchor.appendChild(image);
                    },

                    error: function () {
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
                            else if (url.length > App.config.message.url.max) {
                                var remain = -App.config.message.url.max + origin[1].length;
                                url = origin[1];
                                if (remain < 0) {
                                    url += '/...' + anchor.href.slice(remain);
                                }
                            }
                            anchor.innerHTML = url;
                        }
                    }
                });
                image.classList.add('busy');
                image.src = anchor.href;
            });
        }
        Marionette.CollectionView.prototype.attachHtml.apply(this, arguments);
    }

    Message.ListView = Marionette.CollectionView.extend({
        childView: Message.View,

        onRender: function () {
            var self = this;
            App._dialog = this.collection;
            this.collection.comparator = Message.comparator;
            this.collection.pageableCollection.comparator = Message.comparator;
            this.collection.pageableCollection.once('finish', function () {
                setImmediate(function () {
                    self.scrollLast();
                });
            });
            this.animateLoading();
        },

        onDestroy: function () {
            delete App._dialog;
        },

        scrollLast: function () {
            if (this.collection.models.length > App.config.message.scrollLast) {
                var last = this.collection.models
                    .map(function (a) {
                        return new Date(a.get('time')).getTime()
                    })
                    .reduce(function (a, b) {
                        return Math.max(a, b)
                    });
                last = this.collection.models.find(function (model) {
                    return model.get('time') === new Date(last).toISOString()
                });
                last = this.children.findByModel(last);
                this.collection.sort();
                last.el.scrollIntoView();
            }
        },

        attachHtml: attachHtml
    });

    _.extend(Message.ListView.prototype, listViewMixin);

    Message.DialogListView = Marionette.CollectionView.extend({
        childView: Message.LastMessageView,

        query: {
            skip: 0,
            limit: 64
        },

        behaviors: {
            Pageable: {
                // reverse: true
            }
        },

        onRender: function () {
            this.collection.pageableCollection.queryModel.set('skip', 0);
            this.animateLoading(this.queryModel);
        }
    }, {
        widget: function (region, options) {
            var listView = new Message.DialogListView({collection: Message.getDialogList(options)});
            region.show(listView);
            return listView;
        }
    });

    _.extend(Message.DialogListView.prototype, listViewMixin);

    Message.Dialog = Marionette.View.extend({
        template: '#layout-dialog',

        attributes: {
            'class': 'layout-dialog'
        },

        regions: {
            list: '.list',
            editor: '.editor'
        },

        ui: {
            about: '.about',
            name: '.about input.name',
            list: '.list',
            editor: '.editor'
        },

        events: {
            'keyup .editor': 'resize',
            'scroll .scroll': 'scroll'
        },

        bindings: {
            '.about input.name': {
                observe: 'name',
                onGet: function (value) {
                    return value || this.model.getName();
                }
            }
        },

        modelEvents: {
            'change:name': 'changeModel'
        },

        changeModel: function () {
            this.model.save(null, {
                success: function () {
                    console.log('Saved');
                }
            });
        },

        scroll: function (e) {
            if (e.target.scrollTop < App.config.scroll.next) {
                this.getCollection().pageableCollection.getNextPage();
            }
        },

        resize: function () {
            var text = this.getRegion('editor').currentView.ui.editor;
            var height = text.height();
            var scrollHeight = text[0].scrollHeight;
            if (height * App.config.editor.resize.scroll < scrollHeight) {
                text.css('min-height', App.config.editor.resize.height);
            }
        },

        getCollection: function () {
            return this.getRegion('list').currentView.collection;
        },

        getQuery: function () {
            return this.getCollection().pageableCollection.queryModel;
        },

        initialize: function () {
            var self = this;

            this.read = function (response) {
                if (!self.getRegion('list')) {
                    console.warn('list region not found');
                    return;
                }
                if ('read' === response.type && !response.success) {
                    console.error('Read fail', response);
                    return;
                }
                var count = 0;
                if (response.ids) {
                    count = response.ids.length;
                    self.getCollection().forEach(function (model) {
                        if (response.ids.indexOf(model.id) >= 0) {
                            model.set('unread', 0);
                        }
                    });
                }
                var dialog_id = response.dialog_id || response;
                var dialog = Message.getDialogList().models.find(function (model) {
                    // console.log(dialog_id, model.id);
                    return dialog_id === model.id;
                });
                if (dialog) {
                    dialog.set('unread', 0);
                }
                else {
                    console.error('Dialog not found ' + dialog_id);
                }
                return count;
            };

            this.reply = function (model) {
                function read() {
                    var list = Message.getDialogList();
                    clearTimeout(list.readTimer);
                    list.readTimer = setTimeout(function () {
                        self.read(source_id);
                    }, App.config.message.read.delay);
                }

                var source_id = model.get('source').get('_id');
                var id = self.getQuery().get('id');
                var isMine = App.user._id === source_id;
                var isReceiver = source_id === id || isMine;

                if (isReceiver) {
                    self.getCollection().add(model);
                    self.getCollection().sort();
                    if (!isMine) {
                        if ('visible' === document.visibilityState) {
                            read();
                        }
                        else {
                            document.once('visibilitychange', read);
                        }
                    }
                    self.getRegion('list').currentView.scrollLast();
                }
                return isReceiver;
            };

            Message.channel.reply('dialog', this.reply);
            Message.channel.reply('read', this.read);
        },

        onDestroy: function () {
            Message.channel.stopReplying('read', this.read);
            Message.channel.stopReplying('dialog', this.reply);
        },

        onRender: function () {
            if ('chat' === this.model.get('type') && this.model.isAdmin()) {
                this.ui.name.prop('disabled', false);
            }
            this.stickit();
            App.Views.perfectScrollbar(this.ui.list);
        }
    }, {
        widget: function (region, options) {
            var isChat = 'chat' === options.type;
            var model = isChat ? options.chat : options.target;
            model.set('type', isChat ? 'chat' : 'dialog');
            var query = isChat ? {
                user: 'source',
                select: 'text'
            } : {
                user: 'source.target',
                select: 'text.unread'
            };
            query.sort = '-_id';
            query.id = model.id;
            query.type = model.get('type');
            var list = new Message.List([], {query: query});
            var listView = new Message.ListView({collection: list.fullCollection});
            var draft = isChat
                ? {type: MessageType.CHAT, chat: options.chat}
                : {type: MessageType.DIALOG, target: options.target};
            var editor = new Message.Editor({model: new Message.Model(draft)});
            var dialog = new Message.Dialog({model: model});
            region.show(dialog);
            dialog.getRegion('list').show(listView);
            dialog.getRegion('editor').show(editor);
            function read() {
                var hasUnread = _.some(list.fullCollection.models, function (model) {
                    return model.get('unread');
                });
                if (hasUnread || App.config.message.read.empty) {
                    $.sendJSON('POST', '/api/message/read', {target_id: options.target.id}, dialog.read);
                }
            }

            list.once('finish', function () {
                dialog.el.querySelector('.scroll').on('scroll', function (e) {
                    dialog.scroll.call(dialog, e);
                });
                if (!isChat) {
                    setTimeout(read, App.config.message.read.delay);
                }
            });
            list.getFirstPage();
            return dialog;
        }
    });

    Message.Emoji = Marionette.View.extend({
        template: '#view-empty',

        onRender: function () {
            var self = this;
            _.each(emoji, function (info, smile) {
                info.char = smile;
                smile = isMicrosoftWindows ? $('<img/>') : $('<span/>');
                smile
                    .attr('title', T(info.title) + ' :' + info.name + ':')
                    .attr('data-symbol', info.char)
                    .click(function () {
                        self.trigger('insert', info);
                    });
                if (isMicrosoftWindows) {
                    smile.addClass('emoji');
                    smile.attr('src', App.contentURL('images/smiles/' + info.name + '.png'));
                }
                else {
                    smile.html(info.char);
                }
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
            attach: '.attach',
            editor: '.text'
        },

        regions: {
            editor: '.text',
            smiles: '.smiles',
            files: '.files',
            selection: '.selection'
        },

        events: {
            'click .smile': 'showSmiles',
            'click .send': 'send',
            'click .attach': 'attach'
        },

        initialize: function () {
            this.send = this.send.bind(this);
        },

        onRender: function () {
            if (App.config.message.attach[this.model.get('type')]) {
                this.ui.attach.removeClass('hidden');
            }
            assert.isInstance(this.model.get('files'), App.File.List);
            this.getRegion('files').show(new App.File.AttachmentListView({
                collection: this.model.get('files')
            }));
            window.addEventListener('keyup', this.send);
        },

        onDestroy: function () {
            window.removeEventListener('keyup', this.send);
        },

        attach: function () {
            var self = this;
            var id = this.model.get('_id');
            var upload = App.Views.uploadDialog({
                accept: 'image/jpeg',
                multiple: true,
                params: {owner_id: id}
            });
            upload.on('response', function (data) {
                var file = new App.File.Model(data);
                self.model.get('files').add(file);
            })
        },

        showSmiles: function () {
            var self = this;
            var emojiView = new Message.Emoji();
            emojiView.on('insert', function (smile) {
                var editor = self.ui.editor[0];
                editor.value = editor.value.slice(0, editor.selectionStart)
                    + smile.char + editor.value.slice(editor.selectionEnd);
                self.getRegion('smiles').empty();
            });
            this.getRegion('smiles').show(emojiView);
        },

        send: function (e) {
            var self = this;
            if (e instanceof KeyboardEvent && 'Enter' != e.key) {
                return;
            }
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
                this.model.save('text', text.trim(), {
                    success: function success(model) {
                        self.ui.editor[0].style.removeProperty('min-height');
                        model.loadRelative().then(function () {
                            Message.channel.request(model.get('type'), model);
                            Message.getDialogList().pageableCollection.replaceMessage(model);
                            self.model = model.cloneDraft();
                            self.render();
                        });
                    }
                });
            }
        }
    });

    Message.getUnread = function () {
        return new Promise(function (resolve, reject) {
            $.getJSON('/api/message/read?type=dialog')
                .error(reject)
                .success(function (messages) {
                    resolve(messages);
                });
        });
    };

    Message.Messenger = Marionette.View.extend({
        template: '#layout-messenger',

        regions: {
            dialogList: '.dialog-list .list',
            dialog: '.dialog-region'
        },

        ui: {
            dialogList: '.dialog-list .list',
            dialog: '.dialog-region',
            search: '[type=search]'
        },

        bindings: {
            '[type=search]': 'q'
        },

        attributes: {
            class: 'layout messenger'
        },

        events: {
            'keyup [type=search]': 'search',
            'click .create-chat': 'createChat'
        },

        search: function () {
            Message.getDialogList().pageableCollection.delaySearch();
        },

        createChat: function () {
            $.sendJSON('POST', '/api/chat', {}, function (data) {
                App.navigate('dialog/' + data._id);
            });
        },

        onRender: function () {
            var dialogList = Message.getDialogList();
            this.model = dialogList.pageableCollection.queryModel;
            this.stickit();
            App.Views.perfectScrollbar(this.ui.dialogList);
        },

        open: function (id) {
            var self = this;
            var isChat = id.indexOf('07') === 0;

            function widget(model) {
                var options = {type: isChat ? 'chat' : 'dialog'};
                options['chat' === options.type ? 'chat' : 'target'] = model;
                Message.Dialog.widget(self.getRegion('dialog'), options);
            }

            if (id instanceof Backbone.Model) {
                widget(id);
            }
            else {
                var promise;
                if (isChat) {
                    promise = App.local.getById('chat', id);
                }
                else if (_.isObjectID(id)) {
                    promise = App.local.getById('user', id);
                }
                else if (id) {
                    promise = App.local.fetchOne('user', {domain: id});
                }
                if (promise instanceof Promise) {
                    promise.then(function (data) {
                        var modelClass = _.isEmpty(data.domain) ? Message.Chat : App.User.Model;
                        if (modelClass instanceof Message.Chat) {
                            data.type = 'chat';
                        }
                        widget(new modelClass(data));
                    });
                }
                else {
                    throw new Error('Invalid ID');
                }
            }
        }
    }, {
        widget: function (region, options) {
            if (!region) {
                region = App.getPlace('main');
            }
            if (!options) {
                options = {};
            }
            var messenger = region.currentView;
            if (!(messenger instanceof Message.Messenger)) {
                messenger = new Message.Messenger();
                region.show(messenger);
            }
            Message.DialogListView.widget(messenger.getRegion('dialogList'), options);
            return messenger;
        }
    });

    Message.channel.reply('open', function (id) {
        var messenger = Message.Messenger.widget();

        if (id) {
            messenger.open(id);
        }
        else {
            throw new Error('Invalid ID');
        }
    });

    return new Message.Router({
        controller: {
            wall: function (id) {
                App.User.findOne(id, function (user) {
                    var wall = Message.WallView.widget(App.getPlace('main'), {id: user._id});
                    wall.$el.addClass('scroll');
                });
            },

            news: function () {
                var news = Message.PostListView.widget(App.getPlace('main'), {
                    id: App.user._id,
                    type: 'feed'
                });
                news.$el.addClass('scroll');
            },

            dialog: function (id) {
                if (id) {
                    Message.channel.request('open', id);
                }
                else {
                    Message.Messenger.widget();
                }
            },

            emoji: function () {
                var emoji = new Message.Emoji();
                emoji.$el.addClass('big');
                emoji.$el.addClass('scroll');
                App.getPlace('main').show(emoji);
            }
        }
    });
});
