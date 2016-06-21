"use strict";

App.module('User', function (User, App) {
    User.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'login': 'login',
            'logout': 'logout',
            'signup/:step': 'signup',
            'profile': 'view',
            'view/:id': 'view',
            'edit/:id': 'edit',
            'group/create': 'create',
            'users': 'index',
            'record/:type': 'record',
            'list/:name': 'list'
        }
    });

    User.Login = Backbone.Model.extend({
        url: '/api/user/login',

        validation: {
            login: {
                required: true,
                pattern: /^[\w\-_]|\d{9,16}|[0-9a-f]{24}$/i
            },
            password: {
                required: true
            }
        }
    });

    User.Signup = Backbone.Model.extend({
        validation: {
            phone: {
                required: true,
                pattern: /^\w{9,16}$/
            },
            code: {
                required: true,
                pattern: /^\d{6}$/
            },
            domain: {
                required: true
            },
            email: {
                required: true
            },
            password: {
                required: true
            },
            passwordRepeat: {
                equalTo: 'password'
            },
            forename: {
                required: true
            },
            surname: {
                required: true
            }
        }
    });

    User.Model = Backbone.Model.extend({
        cidPrefix: 'usr',
        
        initialize: function () {
            resolveRelative(this, {
                source: App.User.Model,
                target: App.User.Model
            })
        },

        validation: {
            domain: {
                pattern: /^[\w\._\-]{4,23}$/,
                required: true
            },
            phone: {
                pattern: /^\w{9,16}$/
            }
        },

        getAvatarURL: function () {
            var avatar = this.get('avatar');
            return avatar
                ? ('string' == typeof avatar ? '/api/file/' + avatar : avatar.getFileURL())
                : '/images/man.png';
        },

        setupAvatar: function (el) {
            var avatar = this.get('avatar');
            if (avatar) {
                el.setBackground(avatar);
            }
            else {
                var s = el.style;
                var degree = this.get('_id').slice(-2);
                var saturate = [3, 1, 4, 2];
                saturate = saturate[parseInt(degree[1], 16) % 4];
                degree = degree[1] + degree[0];
                degree = parseInt(degree, 16);
                saturate = ' saturate(' + saturate + '00%)';
                // degree ^= 0xAA;
                degree *= Math.round(256 / 360);
                degree = 'hue-rotate(' + degree + 'deg)';
                s.setProperty('webkitFilter' in s ? '-webkit-filter' : 'filter', degree + saturate);
            }
        },

        toString: function () {
            return this.getName();
        },

        getName: function () {
            var name;
            name = [];
            if (this.get('name')) {
                this.get('name');
            } else {
                if (this.get('forename')) {
                    name.push(this.get('forename'));
                }
                if (this.get('surname')) {
                    name.push(this.get('surname'));
                }
            }
            if (name.length > 0) {
                return name.join(' ');
            } else {
                return this.get('domain');
            }
        }
    });

    User.List = App.PageableCollection.extend({
        url: '/api-cache/user',

        queryModelInitial: {
            type: 'user',
            q: ''
        },

        model: function (attributes, options) {
            return new User.Model(attributes, options);
        }
    });

    // template: '#view-record',

    User.RecordList = User.List.extend({
        url: '/api/record',

        queryModelInitial: {
            type: 'follow',
            target_id: '',
            q: ''
        }
    });

    User.RelationList = User.List.extend({
        url: '/api/user/list',

        queryModelInitial: {
            name: '',
            q: ''
        }
    });

    User.LoginForm = Marionette.View.extend({
        template: '#form-login',

        tagName: 'form',

        initialize: function () {
            return Backbone.Validation.bind(this);
        },

        behaviors: {
            Bindings: {}
        },

        bindings: {
            '[name=login]': 'login',
            '[name=password]': 'password'
        },

        events: {
            'click [type=submit]': 'submit'
        },

        submit: function (e) {
            e.preventDefault();
            return this.login();
        },

        login: function () {
            this.model.set(this.el.serialize());
            if (this.model.isValid(true)) {
                return this.model.save(null, {
                    success: function (model, data) {
                        App.once('login', function () {
                            App.navigate('/profile');
                        });
                        App.login();
                    }
                });
            }
        }
    });

    User.SignupForm = Marionette.View.extend({
        template: '#layout-signup',

        initialize: function () {
            return Backbone.Validation.bind(this);
        },

        regions: {
            loginRegion: '.login-region'
        },

        behaviors: {
            Bindings: {}
        },

        ui: {
            form: '.form-signup'
        },

        bindings: {
            '.form-signup [name=phone]': 'phone',
            '.form-signup [name=code]': 'code',
            '.form-signup [name=domain]': 'domain',
            '.form-signup [name=email]': 'email',
            '.form-signup [name=password]': 'password',
            '.form-signup [name=repeat]': 'repeat',
            '.form-signup [name=forename]': 'forename',
            '.form-signup [name=surname]': 'surname'
        },

        events: {
            'click fieldset.phone button': 'phone',
            'click fieldset.code button': 'code',
            'click fieldset.personal button': 'personal',
            'invalid': 'invalid'
        },

        phone: function () {
            var self = this;
            var phone = this.model.get('phone');
            if (phone) {
                this.model.set('phone', phone.replace(/[^\d]/g, ''));
            }
            if (this.model.isValid('phone')) {
                var found = _.find(country_codes, function (code) {
                    return self.model.get('phone').indexOf(code) === 0;
                });

                if (!found) {
                    this.$el.report('phone', T('Phone number must starts with country code'), 'error');
                } else {
                    $.sendJSON('POST', '/api/user/phone', {phone: this.model.get('phone')}, function (xhr) {
                        var message, response;
                        response = xhr.responseJSON;
                        if (response.success) {
                            App.navigate('/signup/code');
                        } else if (response.error) {
                            message = (twilio.INVALID_NUMBER = response.error.code) ? 'Invalid phone number' : response.error.message;
                            self.$el.report('phone', T(message), 'error');
                        }
                    });
                }
            }
        },

        code: function () {
            if (this.model.isValid('code')) {
                $.sendJSON('POST', '/api/user/code', {code: this.model.get('code')}, function (xhr) {
                    if (xhr.responseJSON.success) {
                        App.navigate('/signup/personal');
                    }
                });
            }
        },

        personal: function () {
            var self = this;
            this.model.set(this.el.serialize());
            var fields = ['password', 'domain', 'email', 'forename', 'surname'];
            if (this.model.isValid(fields)) {
                data = {};
                for (var j = 0; j < fields.length; j++) {
                    var key = fields[j];
                    data[key] = this.model.get(key);
                }
                return $.sendJSON('POST', '/api/user/personal', data, function (xhr) {
                    var result = xhr.responseJSON;
                    if (result.success) {
                        return App.navigate('/login');
                    } else if (code.BAD_REQUEST === xhr.status && result.invalid) {
                        var results = [];
                        for (var name in result.invalid) {
                            var info = result.invalid[name];
                            results.push(self.$el.report(name, info.message, 'error'));
                        }
                        return results;
                    }
                });
            }
        },

        onRender: function () {
            var step = location.pathname.split('/');
            step = _.last(step);
            return this.$el.attr('data-step', step);
        }
    });

    User.EditForm = Marionette.View.extend({
        template: '#form-edit',

        tagName: 'form',

        attributes: {
            "class": 'scroll'
        },

        behaviors: {
            Bindings: {}
        },

        bindings: {
            '[name=type]': 'type',
            '[name=name]': 'name',
            '[name=phone]': 'phone',
            '[name=domain]': 'domain',
            '[name=email]': 'email',
            '[name=about]': 'about'
        },

        ui: {
            title: 'h1 .title',
            domain: '[name=domain]',
            button: 'button',
            avatar: '.field-avatar',
            origin: '.origin'
        },

        events: {
            'submit': 'submit'
        },

        submit: function (e) {
            e.preventDefault();
            return $.sendJSON('POST', '/api/user', this.$el.serialize(), function (xhr) {
                var data;
                data = xhr.responseJSON;
                if (data.success) {
                    return App.navigate('/view/' + data.domain);
                } else {
                    return alert(T('Something wrong happend'));
                }
            });
        },

        onRender: function () {
            var self = this;
            if (this.model.id) {
                return document.title = this.model.getName() + ' - ' + T('Settings');
            } else {
                document.title = T('Create Group');
                this.ui.title.html(document.title);
                this.ui.button.html(T('Create'));
                this.ui.avatar.hide();
                this.$('.create-only').removeClass('create-only');
                this.ui.domain.change(function () {
                    return $.getJSON('/api/user/exists?domain=' + self.ui.domain.val(), function (data) {
                        if (data.success) {
                            self.ui.domain.val(data.value);
                            if (data.exists) {
                                self.$el.report('domain', T('Address already in use'), 'error');
                            } else {
                                self.$el.report('domain', '', false);
                            }
                        }
                    });
                });
                this.ui.origin.html(location.origin);
            }
        }
    });

    User.OtherProfileButtons = Marionette.View.extend({
        template: '#view-other-profile-buttons',

        attributes: {
            'class': 'other-profile-buttons'
        },

        events: {
            'click .message': function () {
                App.navigate('/dialog/' + this.model.get('domain'));
            },
            'click .phone': function () {
                App.navigate('/unavailable');
            },
            'click .camera': function () {
                App.navigate('/unavailable');
            }
        }
    });

    User.View = Marionette.View.extend({
        template: '#layout-user',

        regions: {
            'buttons': '.buttons',
            'message-list': '.message-list',
            'photo-list': '.photo-list',
            'tile0': '[data-number="0"]',
            'tile1': '[data-number="1"]',
            'tile2': '[data-number="2"]',
            'tile3': '[data-number="3"]',
            'tile4': '[data-number="4"]',
            'tile5': '[data-number="5"]',
            'tile6': '[data-number="5"]'
        },

        behaviors: {
            Bindings: {}
        },

        bindings: {
            '.name': 'name',
            '.status': 'status',
            '.audio .value': 'audio',
            '.friends .value': 'friends',
            '.followers .value': 'followers',
            '.groups .value': 'groups',
            '.video .value': 'video'
        },

        ui: {
            background: '.background',
            header: 'header',
            avatar: '.big-avatar',
            edit: '.edit',
            status: '.status',
            photoList: '.photo-list',
            follow: '.follow',
            'tile0': '[data-number="0"]',
            'tile1': '[data-number="1"]',
            'tile2': '[data-number="2"]',
            'tile3': '[data-number="3"]',
            'tile4': '[data-number="4"]',
            'tile5': '[data-number="5"]',
            'tile6': '[data-number="6"]',
        },

        events: {
            'change .status': 'changeStatus',
            'keyup .status': 'keyupStatus',
            'click .follow': 'follow',
            'drop .tile.photo': 'drop',
            'dragover .tile.photo': 'dragover',
            'dragenter .tile.photo': 'dragenter',
            'dragleave .tile.photo': 'dragleave',
            'click .edit': function () {
                return App.navigate('/edit/' + this.model.get('_id'));
            },
            'click .logout': function () {
                return App.logout();
            }
        },
        drop: function (e) {
            e = e.originalEvent;
            e.preventDefault();
            var data = e.dataTransfer.getData('application/json');
            data = JSON.parse(data);
            var dropzone = e.target;
            if (!dropzone.hasAttribute('data-number')) {
                dropzone = dropzone.parentNode;
            }
            var params = {tile: dropzone.getAttribute('data-number'), file_id: data._id};
            console.log(params);
            $.sendJSON('PATCH', '/api/user', params, function () {
                var model = new App.File.Model(data);
                dropzone.classList.remove('empty');
                dropzone.setBackground(model.getFileURL());
            });
        },

        dragover: function (e) {
            e.preventDefault(e);
        },

        dragenter: function (e) {
            e.preventDefault(e);
            e.target.classList.add('dragover');
        },

        dragleave: function (e) {
            e.preventDefault(e);
            e.target.classList.remove('dragover');
        },

        follow: function () {
            var self = this;
            $.sendJSON('POST', '/api/user/list?name=follow&target_id=' + this.model.get('_id'), {}, function (data) {
                if (data.success) {
                    $.sendJSON('PUT', '/api/record?type=follow&target_id=' + self.model.get('_id'), {type: 'follow'}, function (data) {
                        if (data.success) {
                            App.navigate('/list/friend');
                        }
                    });
                }
            });
        },

        changeStatus: function () {
            var self = this;
            return $.sendJSON('POST', '/api/user/status?id=' + this.model.get('_id'), {status: this.model.get('status')}, function () {
                return self.ui.status.blur();
            });
        },

        keyupStatus: function (e) {
            if ('ENTER' === e.key) {
                return this.changeStatus();
            }
        },

        onRender: function () {
            var self = this;
            document.title = this.model.getName();
            var back = this.model.get('background');
            if (back) {
                this.ui.background[0].setBackground();
            }
            if (App.user.follow.indexOf(this.model.get('_id')) < 0) {
                this.ui.follow.show();
            }
            this.model.setupAvatar(this.ui.avatar[0]);
            _.each(this.model.get('tiles'), function (photo, number) {
                $.getJSON('/api/file?id=' + photo, function (photo) {
                    photo = new App.File.Model(photo);
                    var thumbnail = new App.Photo.Thumbnail({model: photo});
                    thumbnail.$el.on('dragover', this.dragover);
                    thumbnail.$el.on('drop', this.drop);
                    self.getRegion('tile' + number).show(thumbnail);
                    self.ui['tile' + number].removeClass('empty');
                    thumbnail.$el.removeAttr('class');
                });
            });
        },

        success: function (data) {
            if (data.verified) {
                App.navigate('login');
            } else {
                this.report('code', 'Invalid code');
            }
        }
    });

    User.RecordView = Marionette.View.extend({
        template: '#view-record',

        behaviors: {
            Bindings: {}
        },

        bindings: {
            '.time': {
                observe: 'time',
                onGet: function (value) {
                    var time = moment(value);
                    return moment.duration(time.diff()).asDays() < 2 ? time.fromNow() : new Date(value).toLocaleString();
                }
            }
        },

        ui: {
            avatar: '.avatar',
            name: '.name',
            'switch': '.switch'
        },

        events: {
            'click .switch > *': 'follow'
        },

        follow: function (e) {
            var action = e.target.getAttribute('class');
            var id = this.model.get('_id');
            var source_id = this.model.get('source').get('_id');
            $.sendJSON('POST', '/api/user/list?name=follow&target_id=' + source_id, {status: action}, function (data) {
                if (data.success) {
                    $.sendJSON('POST', '/api/record?type=follow&id=' + id, {status: action}, function (data) {
                        if (data.success) {
                            e.target.parentNode.setAttribute('data-name', action);
                        }
                    });
                }
            });
        },

        onRender: function () {
            this.ui.name.html(this.model.get('source').getName());
            this.ui.avatar[0].setBackground(this.model.get('source').get('avatar'));
            if (this.model.get('status')) {
                this.ui.switch.attr('data-name', this.model.get('status'));
            }
        }
    });

    User.Thumbnail = Marionette.View.extend({
        template: '#thumbnail-user',
        tagName: 'a',

        ui: {
            avatar: '.avatar',
            name: '.name',
            country: '.country',
            city: '.city'
        },

        events: {
            'click': 'open'
        },

        behaviors: {
            Bindings: {}
        },

        bindings: {
            '.country': 'country',
            '.city': 'city'
        },

        regions: {
            buttons: '.buttons'
        },

        open: function (e) {
            e.preventDefault();
            App.navigate('/view/' + this.model.get('domain'));
        },

        message: function () {
            App.navigate('dialog/' + this.model.get('_id'));
        },

        onRender: function () {
            this.el.href = '/view/' + this.model.get('domain');
            this.ui.name.text(this.model.getName());
            this.model.setupAvatar(this.ui.avatar[0]);
            var me = App.user;
            if (me && me.follow && me.follow.indexOf && me.follow.indexOf(this.model.get('_id')) < 0) {
                var button = new App.Views.Button();
                button.setText('Follow');
                this.getControls().children.push(button);
            }
            this.getRegion('buttons').show(new User.OtherProfileButtons({model: this.model}))
        },

        getControls: function () {
            var region = this.getRegion('buttons');
            if (!region.currentView) {
                var collectionView = new App.Views.Collection();
                region.show(collectionView);
            }
            return region.currentView;
        },

        follow: function () {
            console.log(arguments);
        }
    });

    User.ListView = Marionette.CollectionView.extend({
        childView: User.Thumbnail,

        behaviors: {
            Pageable: {}
        }
    });

    User.SearchView = Marionette.View.extend({
        template: '#layout-user-search',

        behaviors: {
            Bindings: {}
        },

        bindings: {
            '[type=search]': 'q'
        },

        attributes: {
            'class': 'scroll'
        },

        ui: {
            search: '[type=search]',
            list: '.list'
        },

        regions: {
            list: '.list'
        },

        modelEvents: {
            'change q': 'search'
        },

        onRender: function () {

        },

        getCollection: function () {
            return this.getRegion('list').currentView.collection.pageableCollection;
        },

        search: function () {
            this.getCollection().delaySearch();
            var self = this;
            this.ui.list.busy(true);
            this.getCollection().delaySearch(function () {
                self.ui.list.busy(false);
            })
        }
    });

    return new User.Router({
        controller: {
            login: function () {
                if (App.user) {
                    App.logout();
                }
                else {
                    App.getPlace('main').show(new User.LoginForm({
                        model: new User.Login()
                    }));
                    return $(document.body).addClass('login');
                }
            },

            logout: function () {
                return App.logout();
            },

            signup: function (step) {
                var signup;
                signup = new User.SignupForm({
                    model: new User.Signup()
                });
                App.getPlace('main').show(signup);
                return signup.loginRegion.show(new User.LoginForm({
                    model: new User.Login()
                }));
            },

            view: function (domain) {
                if (!domain) {
                    domain = App.user.domain;
                }
                $.get('/api/user?domain=' + domain, function (user) {
                    App.local.put('user', user);
                    user = new User.Model(user);
                    var profile = new User.View({model: user});
                    profile.el.classList.add('scroll');
                    profile.el.classList.add(user.get('type'));
                    App.getPlace('main').show(profile);
                    // photoList.state.pageSize = Math.floor(2 * (profile.ui.photoList.width() / 64)) - 1;
                    profile.getRegion('message-list').show(App.Message.WallView.widget(user.get('_id')));
                    profile.getRegion('buttons').show(new User.OtherProfileButtons({model: user}));
                    App.local.getById('user/informer', user.get('_id')).then(function (informer) {
                        user.set(informer);
                    });
                    App.Photo.ListView.widget(profile.getRegion('photo-list'), {
                        owner_id: user._id
                    });
                });
            },

            edit: function (id) {
                var model;
                model = new User.Model({
                    _id: id
                });
                model.fetch();
                return App.getPlace('main').show(new User.EditForm({
                    model: model
                }));
            },

            create: function () {
                var form, model;
                model = new User.Model({
                    type: App.route[0]
                });
                form = new User.EditForm({
                    model: model
                });
                return App.getPlace('main').show(form);
            },

            index: function () {
                var pageable = new User.List();
                pageable.queryModel.set('type', 'user');
                var listView = new User.ListView({collection: pageable.fullCollection});
                var layout = new User.SearchView({model: pageable.queryModel});
                App.getPlace('main').show(layout);
                layout.getRegion('list').show(listView);
                pageable.getFirstPage();
            },

            list: function (name) {
                var pageable = new User.RelationList();
                pageable.queryModel.set('name', name);
                var listView = new User.ListView({collection: pageable.fullCollection});
                var layout = new User.SearchView({model: pageable.queryModel});
                App.getPlace('main').show(layout);
                layout.getRegion('list').show(listView);
                pageable.getFirstPage();
            },

            record: function (type) {
                var pageable = new User.RecordList();
                pageable.queryModel.set('target_id', App.user._id);
                var listView = new User.ListView({
                    childView: User.RecordView,
                    collection: pageable.fullCollection
                });
                var layout = new User.SearchView({model: pageable.queryModel});
                App.getView().getRegion('main').show(layout);
                layout.getRegion('list').show(listView);
                pageable.getFirstPage();
            }
        }
    });
});
