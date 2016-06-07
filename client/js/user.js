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
            'users': 'index'
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
        validation: {
            domain: {
                pattern: /^[\w\._\-]{4,23}$/,
                required: true
            },
            phone: {
                pattern: /^\w{9,16}$/
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
                        return App.login();
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
                var found = _.find(codes, function (code) {
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

    User.View = Marionette.View.extend({
        template: '#layout-user',

        regions: {
            'message-list': '.message-list'
        },

        behaviors: {
            Bindings: {}
        },

        ui: {
            background: '.background',
            header: 'header',
            avatar: '.big-avatar',
            edit: '.edit',
            status: '.status'
        },

        events: {
            // 'dragenter .big-avatar': preventDefault,
            // 'dragover .big-avatar': preventDefault,
            // 'drop .big-avatar': 'dropAvatar',
            'click .edit': function () {
                return App.navigate('/edit/' + this.model.get('_id'));
            },
            'change .status': 'changeStatus',
            'keyup .status': 'keyupStatus',
            'click .logout': function () {
                return App.logout();
            }
        },

        bindings: {
            '.name': 'name',
            '.status': 'status'
        },

        changeStatus: function () {
            var self = this;
            return $.sendJSON('POST', '/api/user/status?id=' + this.model.get('_id'), {status: this.model.get('status')}, function () {
                return self.ui.status.blur();
            });
        },

        keyupStatus: function (e) {
            if (KeyCode.ENTER === e.keyCode) {
                return this.changeStatus();
            }
        },

        dropAvatar: function (e) {
            var self = this;
            e.preventDefault();
            var file = e.originalEvent.dataTransfer.files[0];
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/photo');
            xhr.onload = function () {
                if (xhr.status < 300) {
                    var response = JSON.parse(xhr.responseText);
                    return $.post('/api/user/change?field=avatar&value=' + response._id, function () {
                        return self.ui.avatar[0].setBackground(response._id);
                    });
                }
            };
            xhr.send(file);
        },

        onRender: function () {
            document.title = this.model.getName();
            var back = this.ui.background[0];
            back.setBackground(this.model.get('background'));
            // this.ui.header.find('.photo').each(function (i, p) {
            //     var r = Math.round(Math.random() * 35);
            //     r = ('000000000000000000000000' + r).slice(-24);
            //     p.setAttribute('draggable', 'true');
            //     p.style.backgroundImage = 'url("/photo/' + r + '.jpg")';
            //     App.draggable(p);
            //     return p.addEventListener('dragleave', function (e) {
            //         return $.sendJSON('POST', '/api/user/change?field=background&value=' + r, {}, function () {
            //             return back.setBackground(r);
            //         });
            //     });
            // });
            return this.setAvatar();
        },

        setAvatar: function () {
            this.ui.avatar.css('background-image', 'url("' + (App.avatarUrl(this.model.id)) + '")');
        },

        success: function (data) {
            if (data.verified) {
                App.navigate('login');
            } else {
                this.report('code', 'Invalid code');
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

        regions: {
            control: '.control-region'
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
            this.ui.avatar[0].setBackground('/api/user/avatar?id=' + this.model.get('_id'));
            this.ui.country.text(this.model.get('country'));
            this.ui.city.text(this.model.get('city'));
            if (App.user.follow.indexOf(this.model.get('_id')) < 0) {
                var button = new App.Views.Button();
                button.setText('Follow');
                this.getControls().children.push(button);
            }
        },
        
        getControls: function () {
            var region = this.getRegion('control');
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
            // var self = this;
            // this.ui.list.busy(true);
            // this.getCollection().delaySearch(function () {
            //     self.ui.list.busy(false);
            // })
        }
    });

    return new User.Router({
        controller: {
            login: function () {
                App.mainRegion.show(new User.LoginForm({
                    model: new User.Login()
                }));
                return $(document.body).addClass('login');
            },

            logout: function () {
                return App.logout();
            },

            signup: function (step) {
                var signup;
                signup = new User.SignupForm({
                    model: new User.Signup()
                });
                App.mainRegion.show(signup);
                return signup.loginRegion.show(new User.LoginForm({
                    model: new User.Login()
                }));
            },

            view: function (domain) {
                if (!domain) {
                    domain = App.user.domain;
                }
                $.get('/api/user?domain=' + domain, function (user) {
                    user = new User.Model(user);
                    var profile = new User.View({model: user});
                    profile.el.classList.add('scroll');
                    profile.el.classList.add(user.get('type'));
                    App.mainRegion.show(profile);
                    profile.showChildView('message-list', App.Message.ListView.wall(user.get('_id')));
                });
            },

            edit: function (id) {
                var model;
                model = new User.Model({
                    _id: id
                });
                model.fetch();
                return App.mainRegion.show(new User.EditForm({
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
                return App.mainRegion.show(form);
            },

            index: function () {
                var pageable = new User.List();
                pageable.queryModel.set('type', 'user');
                var listView = new User.ListView({collection: pageable.fullCollection});
                var layout = new User.SearchView({model: pageable.queryModel});
                App.getView().getRegion('main').show(layout);
                layout.getRegion('list').show(listView);
                pageable.getFirstPage();
            }
        }
    });
});
