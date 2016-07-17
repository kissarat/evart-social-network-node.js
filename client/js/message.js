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
        Message.channel.request('read', message);
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
            var self = this;
            resolveRelative(this, {
                source: App.User.Model,
                target: App.User.Model,
                owner: App.User.Model
            });

            if (!this.has('time')) {
                this.set('time', new Date().toISOString())
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

        query: {
            type: 0,
            limit: 25
        },

        model: function (attrs, options) {
            return new Message.Model(attrs, options);
        }
    });

    Message.comparator = function (a, b) {
        // var order = b.getTime() - a.getTime();
        // return order || b.getIndex() - a.getIndex();
        return b.getIndex() - a.getIndex();
    };

    Message.DialogList = App.PageableCollection.extend({
        url: '/api/message/dialogs',

        query: {
            type: 'dialog'
        },

        model: function (attrs, options) {
            return new Message.LastMessage(attrs, options);
        },

        parseRecords: function (records) {
            records.forEach(function (record) {
                if (record.text.length > App.config.message.cut) {
                    record.text = record.text.slice(0, App.config.message.cut) + '…';
                }
            });
            return App.PageableCollection.prototype.parseRecords.call(this, records);
        }
    });

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
            if (App.user._id === this.model.get('source')) {
                this.$el.addClass('mine');
                new App.User.Model(App.user).setupAvatar(ui.source_avatar);
                ui.source_avatar.show();
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
        template: '#view-post',

        regions: {
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
            name: '> .content > .message > .name',
            info: '> .content > .info',
            avatar: '> .content > .info .avatar',
            time: '> .content > .info .time',
            text: '> .content > .message > .text',
            controls: '> .controls',
            comment: '> .controls .comment'
        },

        events: {
            'click > .controls .fa-share-alt': 'share',
            'click > .content > .message > .name': 'view',
            'click .attitude > *': 'estimate'
        },

        view: function (e) {
            e.preventDefault();
            if (location.pathname != this.ui.name.attr('href')) {
                App.navigate(this.ui.name.attr('href'));
            }
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
            this.stickit();
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

    Message.WallView = Marionette.CollectionView.extend({
        childView: Message.PostView,

        onRender: function () {
            this.animateLoading();
        }
    }, {
        widget: function (region, options) {
            var pageable = new Message.List([], {
                query: _.merge({
                    type: MessageType.WALL,
                    owner_id: App.user._id,
                    user: 'source',
                    select: 'like.hate.files.videos.sex.text'
                }, _.pick(options, 'owner_id', 'user', 'select'))
            });
            var wall = new Message.WallView({
                collection: pageable.fullCollection
            });
            region.show(wall);
            pageable.getFirstPage();
            return wall;
        }
    });

    _.extend(Message.WallView.prototype, listViewMixin);

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
                            else if (url.length > 64) {
                                var remain = -64 + origin[1].length;
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
            this.collection.pageableCollection.once('finish', function () {
                setImmediate(function () {
                    self.scrollLast();
                });
            });
            this.animateLoading();
        },

        destroy: function () {
            delete App._dialog;
        },

        scrollLast: function () {
            if (this.collection.models.length > 2) {
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
                this.collection.comparator = Message.comparator;
                // this.collection.pageableCollection.comparator = Message.comparator;
                this.collection.sort();
                last.el.scrollIntoView();
            }
        },

        attachHtml: attachHtml
    });

    _.extend(Message.ListView.prototype, listViewMixin);

    Message.DialogListView = Marionette.CollectionView.extend({
        childView: Message.LastMessageView,

        events: {
            'scroll': 'scroll'
        },

        scroll: function (e) {
            var delta = e.target.scrollHeight - innerHeight - e.target.scrollTop;
            if (delta < 100) {
                this.animateLoading(this.queryModel);
                var collection = this.collection.pageableCollection;
                if (!collection.queryModel.get('loading')) {
                    collection.getNextPage();
                }
            }
        },

        onRender: function () {
            this.animateLoading(this.queryModel);
        }
    }, {
        widget: function (region, options) {
            var list = new Message.DialogList([], {
                query: _.merge({
                    id: App.user._id
                }, _.pick(options, 'unread', 'cut', 'since'))
            });
            var listView = new Message.DialogListView({collection: list.fullCollection});
            listView.$el.addClass('scroll');
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
            list: '.list',
            editor: '.editor'
        },

        ui: {
            list: '.list',
            editor: '.editor'
        },

        events: {
            'keyup .editor': 'resize'
            // 'scroll .scroll': 'scroll'
        },

        scroll: function (e) {
            if (e.target.scrollTop < 100) {
                this.getCollection().pageableCollection.getNextPage();
            }
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
            function read() {
                App.debounce(self, function () {
                    self.read(source_id)
                });
            }

            var source_id = model.get('source').get('_id');
            var id = this.getQuery().get('id');
            var isMine = App.user._id === source_id;
            var isReceiver = source_id === id || isMine;

            if (isReceiver) {
                this.getCollection().add(model);
                this.getCollection().sort();
                if (!isMine) {
                    if ('visible' === document.visibilityState) {
                        read();
                    }
                    else {
                        document.once('visibilitychange', read);
                    }
                }
                this.getRegion('list').currentView.scrollLast();
            }
            return isReceiver;
        },

        read: function (ids) {
            if (ids.ids && ids.success) {
                ids = ids.ids;
            }
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
            var query = _.defaults(_.pick(options, 'type', 'id', 'user', 'sort'), {
                type: MessageType.DIALOG,
                user: 'source.target',
                select: 'unread.text',
                sort: '-_id'
            });
            var list = new Message.List([], {query: query});
            var listView = new Message.ListView({collection: list.fullCollection});
            var editor = new Message.Editor({
                model: new Message.Model(_.merge(_.pick(options, 'type', 'source'), {
                    target: options.id,
                    unread: 1,
                    type: 'dialog'
                }))
            });
            var dialog = new Message.Dialog();
            region.show(dialog);
            dialog.getRegion('list').show(listView);
            dialog.getRegion('editor').show(editor);
            list.getFirstPage();
            list.once('finish', function () {
                dialog.el.querySelector('.scroll').on('scroll', function (e) {
                    dialog.scroll.call(dialog, e);
                });
                setTimeout(function () {
                    var hasUnread = _.some(list.fullCollection.models, function (model) {
                        return model.get('unread')
                    });
                    if (hasUnread || App.config.message.read.empty) {
                        $.getJSON('/api/message/read?target_id=' + options.id, dialog.read);
                    }
                }, App.config.message.read.delay);
            });
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
            attach: '.attach',
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
            if (App.config.message.attach) {
                this.ui.attach.removeClass('hidden');
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

            function success(model) {
                model.loadRelative().then(function () {
                    Message.channel.request('dialog', model.clone());
                    self.model.set('text', '');
                    self.ui.editor[0].style.removeProperty('min-height');
                });
            }

            if (text) {
                text = text.replace(/:[a-z_]+:/g, function (match) {
                    for (var symbol in emoji) {
                        var info = emoji[symbol];
                        if (match == info[0]) {
                            return symbol;
                        }
                    }
                });
                this.model.set('time', Date.now());
                this.model.unset('_id');
                ['source', 'target'].forEach(function (property) {
                    if (self.model.get(property) instanceof App.User.Model) {
                        console.error(property, 'is object');
                        self.model.set(property, self.model.get(property).get('_id'))
                    }
                });
                this.model.save('text', text, {success: success});
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

    return new Message.Router({
        controller: {
            wall: function (id) {
                App.User.findOne(id, function (user) {
                    var wall = Message.WallView.widget(App.getPlace('main'), {owner_id: user._id});
                    wall.$el.addClass('scroll');
                });
            },

            dialog: function (id) {
                App.User.findOne(id, function (user) {
                    Message.Dialog.widget(App.getPlace('main'), {id: user._id});
                });
            },

            dialogs: function () {
                Message.DialogListView.widget(App.getPlace('main'), {});
            }
        }
    });
});
