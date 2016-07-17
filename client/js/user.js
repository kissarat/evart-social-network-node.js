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
            'settings': 'edit',
            'group/create': 'create',
            'users': 'index',
            'record/:type': 'record',
            'list/:name': 'list'
        }
    });

    User.Model = Backbone.Model.extend({
        idAttribute: '_id',
        cidPrefix: 'usr',

        url: function () {
            if (this.has('_id') || this.has('domain')) {
                var where = {};
                if (this.has('_id')) {
                    where.id = this.get('_id');
                }
                else {
                    where.domain = this.get('domain')
                }
                return '/api/user?' + $.param(_.merge(this.query, where));
            }
        },

        query: {
            select: [
                "avatar", "birthday", "city", "city_id", "country", "domain",
                "forename", "lang", "name", "relationship", "sex", "surname", "tiles"
            ].join('.')
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

        canManage: function () {
            return 'admin' === App.user.type
                || App.user._id === this.get('_id')
                || _.contains(this.get('admin'), App.user._id);
        },

        getAvatarURL: function () {
            var avatar = this.get('avatar');
            return avatar
                ? ('string' == typeof avatar ? '/api/file/' + avatar : avatar.getFileURL())
                : '/images/' + this.getSex() + '.png';
        },
        

        getSex: function () {
            return this.get('sex') || 'male';
        },

        setupAvatar: function (el) {
            if (el instanceof jQuery) {
                el = el[0];
            }
            var avatar = this.get('avatar');
            el.setBackground(avatar);
            if (!avatar) {
                var s = el.style;
                var id = this.get('_id');
                if (!id) {
                    throw new Error('Model is not initialized');
                }
                var degree = id.slice(-2);
                var saturate = [3, 1, 4, 2];
                saturate = saturate[parseInt(degree[1], 16) % 4];
                degree = degree[1] + degree[0];
                degree = parseInt(degree, 16);
                saturate = ' saturate(' + saturate + '00%)';
                // degree ^= 0xAA;
                degree *= Math.round(256 / 360);
                degree = 'hue-rotate(' + degree + 'deg)';
                s.setProperty('webkitFilter' in s ? '-webkit-filter' : 'filter', degree + saturate, '');
            }
        },

        toString: function () {
            return this.get('_id');
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
        },

        getCountryId: function () {
            var country = this.get('country');
            return country ? _.find(countries, {iso: country})._id : country;
        }
    });

    User.List = App.PageableCollection.extend({
        url: '/api/user',

        query: {
            type: 'user',
            select: 'surname.forename.avatar.online.country.city.birthday',
            q: ''
        },

        model: function (attributes, options) {
            return new User.Model(attributes, options);
        }
    });

    // template: '#view-record',

    User.RecordList = User.List.extend({
        url: '/api/record',

        query: {
            type: 'follow',
            target_id: '',
            q: ''
        }
    });

    User.RelationList = User.List.extend({
        url: '/api/user/list',

        query: {
            name: '',
            q: ''
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
            this.login();
        },

        login: function () {
            if (this.model.isValid(true)) {
                return this.model.save(null, {
                    success: function () {
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
                phone = phone.replace(/[^\d]/g, '');
                this.model.set('phone', phone);
            }
            if (this.model.isValid('phone')) {
                var code = _.find(country_codes, function (code) {
                    return phone.indexOf(code) === 0;
                });

                if (code) {
                    var data = {phone: this.model.get('phone')};
                    $.sendJSON('POST', '/api/user/phone', data, function (data) {
                        if (data.success) {
                            App.navigate('/signup/code');
                        } else if (data.error) {
                            var error = data.error;
                            message = (twilio.INVALID_NUMBER = error.code) ? 'Invalid phone number' : error.message;
                            self.$el.report('phone', T(message), 'error');
                        }
                    });
                }
                else {
                    this.$el.report('phone', T('Phone number must starts with country code'), 'error');
                }
            }
        },

        code: function () {
            if (this.model.isValid('code')) {
                $.sendJSON('POST', '/api/user/code', {code: this.model.get('code')}, function (data) {
                    if (data.success) {
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
                $.sendJSON('POST', '/api/user/personal', data, function (data) {
                    if (data.success) {
                        App.navigate('/login');
                    }
                    else if (data.invalid) {
                        for (var name in data.invalid) {
                            var info = data.invalid[name];
                            self.$el.report(name, info.message, 'error');
                        }
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
        cidPrefix: 'edit',

        tagName: 'form',

        attributes: {
            "class": 'scroll view form-edit'
        },

        regions: {
            city: '.city'
        },

        bindings: {
            '[name=about]': 'about',
            '[name=birthday]': {
                observe: 'birthday',
                onGet: function (value) {return moment(value).format('YYYY-MM-DD')}
            },
            '[name=country]': 'country',
            '[name=domain]': 'domain',
            '[name=email]': 'email',
            '[name=language]': 'lang',
            '[name=name]': 'name',
            '[name=phone]': 'phone',
            '[name=relationship]': 'relationship',
            '[name=sex]': 'sex',
            '[name=type]': 'type',
            'h1 .title': 'domain'
        },

        ui: {
            avatar: '.field-avatar',
            birthday: '[name=birthday]',
            button: 'button',
            country: '[name=country]',
            domain: '[name=domain]',
            icon: 'h1 .fa',
            origin: '.origin',
            language: '[name=language]',
            relationship: '[name=relationship]',
            sex: '[name=sex]',
            title: 'h1 .title'
        },

        events: {
            'submit': 'submit'
        },

        submit: function (e) {
            e.preventDefault();
            var model = this.model;
            if ('group' != this.model.get('type')) {
                this.model.set('model', this.model.get('surname') + ' ' + this.model.get('forename'));
            }
            var isLanguageChanged = App.language == model.get('language');
            App.language = model.get('language');
            model.save(null, {
                success: function () {
                    var url = '/view/' + model.get('_id');
                    if (isLanguageChanged) {
                        location.href = url;
                    }
                    else {
                        App.navigate(url);
                    }
                }
            });
        },

        onRender: function () {
            var self = this;
            if ('group' != this.model.get('type')) {
                this.$('.user-only').removeClass('user-only');
                this.ui.birthday.datepicker(App.config.datepicker.birthday);
                if ('user' == this.model.get('type')) {
                    this.ui.icon.attr('class', 'fa fa-user');
                }
                else if ('admin' == this.model.get('type')) {
                    this.ui.icon.attr('class', 'fa fa-beer');
                }
                this.ui.language.append(App.Views.createOptionsFragment(Languages, 'iso', 'name'));
                this.ui.relationship.append(App.Views.createOptionsFragment(HumanRelationship));
                this.ui.sex.append(App.Views.createOptionsFragment(Sex));
            }
            if (this.model.id) {
                document.title = this.model.getName() + ' - ' + T('Settings');
            } else {
                document.title = T('Create Group');
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
            this.ui.title.html(document.title);
            var citySearch = App.Geo.CitySearch.widget(this.getRegion('city'));

            if (this.model.has('city')) {
                citySearch.model.set('q', this.model.get('city'));
            }
            citySearch.on('clear', function () {
                // self.model.set('city_id', null);
                self.model.set('city', '');
            });

            citySearch.model.on('change:cid', function (model, value) {
                self.model.set('city_id', value);
            });
            citySearch.model.on('change:title', function (model, value) {
                self.model.set('city', value);
            });

            function changeCountry() {
                citySearch.model.set('country_id', self.model.getCountryId());
            }

            this.model.on('change:country', changeCountry);

            App.Geo.getCountriesFragment(function (fragment) {
                self.ui.country.append(fragment);
                self.stickit();
                changeCountry();
            });
        }
    });

    User.ProfileButtons = Marionette.View.extend({
        template: '#view-profile-buttons',
        cidPrefix: 'profile-butthons',

        attributes: {
            'class': 'profile-buttons'
        },

        events: {
            'click .settings': function () {
                App.navigate('/edit/' + this.model.get('_id'));
            },
            'click .statistics': function () {
                App.navigate('/unavailable');
            },
            'click .logout': function () {
                App.logout();
            }
        }
    });

    User.OtherProfileButtons = Marionette.View.extend({
        template: '#view-other-profile-buttons',
        cidPrefix: 'profile-buttons',

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
        cidPrefix: 'user',

        regions: {
            buttons: '.buttons',
            'message-list': '.message-list',
            'photo-list': '.photo-list',
            tile0: '[data-number="0"]',
            tile1: '[data-number="1"]',
            tile2: '[data-number="2"]',
            tile3: '[data-number="3"]',
            tile4: '[data-number="4"]',
            tile5: '[data-number="5"]',
            tile6: '[data-number="6"]'
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
            '.video .value': 'video',
            '.country': 'country',
            '.city': {
                observe: 'city',
                onGet: function (value) {
                    return value ? value + ',' : value;
                }
            }
        },

        ui: {
            background: '.background',
            header: 'header',
            avatar: '.big-avatar',
            edit: '.edit',
            status: '.status',
            photoList: '.photo-list',
            follow: '.follow',
            tile0: '[data-number="0"]',
            tile1: '[data-number="1"]',
            tile2: '[data-number="2"]',
            tile3: '[data-number="3"]',
            tile4: '[data-number="4"]',
            tile5: '[data-number="5"]',
            tile6: '[data-number="6"]'
        },

        events: {
            'click .follow': 'follow',
            'drop .tile.photo': 'drop',
            'keyup .status': 'keyupStatus',
            'change .status': 'changeStatus',
            'dragover .tile.photo': 'dragover',
            'dragenter .tile.photo': 'dragenter',
            'dragleave .tile.photo': 'dragleave',
            'click .big-avatar .fa-camera': 'uploadAvatar',
            'click .profile-relative > .fa-camera': 'uploadBackground',
            'click [data-number]': 'uploadTile',
            'click .logout': 'logout',
            'click .edit': 'edit'
        },

        logout: function () {
            return App.logout();
        },

        edit: function () {
            return App.navigate('/edit/' + this.model.get('_id'));
        },

        uploadAvatar: function () {
            this.upload(
                function (data) {
                    return {avatar_id: data._id};
                },
                function (file) {
                    this.ui.avatar[0].setBackground(file.getFileURL());
                }
            );
        },

        uploadBackground: function () {
            this.upload(
                function (data) {
                    return {background_id: data._id};
                },
                function (file) {
                    this.ui.background[0].setBackground(file.getFileURL());
                }
            );
        },

        uploadTile: function (e) {
            this.upload(
                function (data) {
                    return {
                        tile: this.getTileNumber(e.target),
                        file_id: data._id
                    };
                },
                function (file) {
                    this.setTile(file, this.getTileRegion(e.target));
                }
            );
        },

        upload: function (params_cb, success) {
            var self = this;
            var owner_id = this.model.get('_id');
            var upload = App.Views.uploadDialog({
                accept: 'image/jpeg',
                params: {
                    owner_id: owner_id
                }
            });
            upload.on('response', function (data) {
                var file = new App.File.Model(data);
                $.sendJSON('PATCH', '/api/user?id=' + owner_id, params_cb.call(self, data), function (response) {
                    if (response.success) {
                        success.call(self, file);
                    }
                });
            })
        },

        setTile: function (file, tile) {
            if (!(file instanceof App.File.Model)) {
                file = new App.File.Model(file);
            }
            var thumbnail = new App.Photo.Thumbnail({model: file});
            var region = this.getTileRegion(tile);
            region.show(thumbnail);
            thumbnail.$el.removeClass('empty');
            return thumbnail;
        },

        getTileNumber: function (el) {
            if (el instanceof App.Photo.Thumbnail) {
                el = el.el;
            }
            if (el instanceof Element) {
                if (!el.hasAttribute('data-number')) {
                    el = el.parentNode;
                }
                el = el.getAttribute('data-number');
            }
            return el;
        },

        getTileRegion: function (number) {
            if (number instanceof Marionette.Region) {
                return number;
            }
            return this.getRegion('tile' + +this.getTileNumber(number));
        },

        drop: function (e) {
            var self = this;
            e = e.originalEvent;
            e.preventDefault();
            var file = e.dataTransfer.getData('application/json');
            file = JSON.parse(file);
            var params = {
                tile: this.getTileNumber(e.target),
                file_id: file._id
            };
            $.sendJSON('PATCH', '/api/user?id=' + this.model.get('_id'), params, function (data) {
                if (data.success) {
                    self.setTile(file, self.getTileRegion(e.target));
                }
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
            var url = '/api/user/list?name=follow&target_id=' + this.model.get('_id');
            $.sendJSON('POST', url, {}, function (data) {
                if (data.success) {
                    var url = '/api/record?type=follow&target_id=' + self.model.get('_id');
                    $.sendJSON('PUT', url, {type: 'follow'}, function (data) {
                        if (data.success) {
                            App.navigate('/list/friend');
                        }
                    });
                }
            });
        },

        changeStatus: function () {
            var self = this;
            var data = {status: this.model.get('status')};
            return $.sendJSON('POST', '/api/user/status?id=' + this.model.get('_id'), data, function (data) {
                if (data.success) {
                    self.ui.status.blur();
                }
            });
        },

        keyupStatus: function (e) {
            if ('ENTER' === e.key) {
                return this.changeStatus();
            }
        },

        success: function (data) {
            if (data.verified) {
                App.navigate('login');
            } else {
                this.report('code', 'Invalid code');
            }
        },

        onRender: function () {
            var self = this;
            document.title = this.model.getName();
            var back = this.model.get('background');
            if (back) {
                this.ui.background[0].setBackground(back);
            }
            else {
                back = this.model.get('_id')[23];
                back = parseInt(back, 16) >> 1;
                this.ui.background[0].setBackground('/images/bg/' + back + '.jpg');
            }
            if (App.user.follow.indexOf(this.model.get('_id')) < 0) {
                this.ui.follow.show();
            }
            this.model.setupAvatar(this.ui.avatar[0]);
            _.each(this.model.get('tiles'), function (file_id, tile) {
                if (file_id) {
                    $.getJSON('/api/file?id=' + file_id, function (file) {
                        self.setTile(file, tile).$el
                            .on('dragover', this.dragover)
                            .on('drop', this.drop);
                    });
                }
            });
            if (!this.model.canManage()) {
                this.$('.fa-camera').remove();
            }
        }
    });

    User.RecordView = Marionette.View.extend({
        template: '#view-record',
        cidPrefix: 'rcdv',

        behaviors: {
            Bindings: {}
        },

        bindings: {
            '.time': {
                observe: 'time',
                onGet: function (value) {
                    var time = moment(value);
                    return moment.duration(time.diff()).asDays() < 2
                        ? time.fromNow() : new Date(value).toLocaleString();
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
        cidPrefix: 'usrt',

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
            '.country': 'country'
        },

        regions: {
            buttons: '.buttons'
        },

        open: function (e) {
            e.preventDefault();
            App.navigate(this.el.getAttribute('href'));
        },

        message: function () {
            App.navigate('dialog/' + this.model.get('_id'));
        },

        onRender: function () {
            this.el.href = '/view/' + this.model.get('domain');
            this.ui.name.text(this.model.getName());
            this.model.setupAvatar(this.ui.avatar[0]);
            var me = App.user;
            // if (me && me.follow && me.follow.indexOf && me.follow.indexOf(this.model.get('_id')) < 0) {
            //     var button = new App.Views.Button();
            //     button.setText('Follow');
            //     this.getControls().children.push(button);
            // }
            this.getRegion('buttons').show(new User.OtherProfileButtons({model: this.model}));
            if (this.model.get('city')) {
                this.ui.city.html(', ' + this.model.get('city'));
            }
        },

        follow: function () {
            console.log(arguments);
        }
    });

    User.ListView = Marionette.CollectionView.extend({
        childView: User.Thumbnail,
        cidPrefix: 'usrlv',

        behaviors: {
            Pageable: {}
        }
    });

    User.SearchView = Marionette.View.extend({
        template: '#layout-user-search',
        cidPrefix: 'usrsv',

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
            var self = this;
            this.getCollection().delaySearch();
            this.ui.list.busy(true);
            this.getCollection().delaySearch(function () {
                self.ui.list.busy(false);
            })
        }
    });
    
    User.findOne = function (id, cb) {
        var params = {select: 'domain.surname.forename.online.country.city_id.city.avatar.sex'};
        if (_.isObjectID(id)) {
            params.id = id;
        }
        else {
            params.domain = id;
        }
        $.get({
            url: '/api-cache/user?' + $.param(params),
            complete: function (xhr) {
                if (code.NOT_FOUND === xhr.status) {
                    App.show(App.Views.Error, {
                        code: 404,
                        text: 'User not found'
                    });
                }
                else {
                    cb(xhr.responseJSON);
                }
            }
        });
    };

    return new User.Router({
        controller: {
            login: function () {
                if (App.isAuthenticated()) {
                    App.logout();
                }
                else {
                    App.getPlace('main').show(new User.LoginForm({
                        model: new User.Login()
                    }));
                    document.body.classList.add('login');
                }
            },

            logout: function () {
                App.logout();
            },

            signup: function () {
                var signup = new User.SignupForm({
                    model: new User.Signup()
                });
                App.getPlace('main').show(signup);
                signup.loginRegion.show(new User.LoginForm({
                    model: new User.Login()
                }));
            },

            view: function (domain) {
                if (!domain) {
                    domain = App.user.domain;
                }
                var params = {};
                if (_.isObjectID(domain)) {
                    params.id = domain
                }
                else {
                    params.domain = domain;
                }
                params.select = 'domain.surname.forename.name.country.city.city_id.tiles.avatar.background';
                var url = '/api/user?' + $.param(params);
                $.get(url, function (user) {
                    App.local.put('user', user);
                    user = new User.Model(user);
                    var profile = new User.View({model: user});
                    profile.el.classList.add('scroll');
                    profile.el.classList.add(user.get('type'));
                    App.getPlace('main').show(profile);
                    var buttons = user.get('_id') == App.user._id ? User.ProfileButtons : User.OtherProfileButtons;
                    buttons = new buttons({model: user});
                    App.Message.WallView.widget(profile.getRegion('message-list'), {owner_id: user.get('_id')});
                    profile.getRegion('buttons').show(buttons);
                    var params = {
                        id: user.get('_id'),
                        select: 'follows.followers.groups.video.audio.friends.photo'
                    };
                    $.getJSON('/api/user/informer?' + $.param(params), function (informer) {
                        user.set(informer);
                    });
                    App.Photo.ListView.widget(profile.getRegion('photo-list'), {
                        owner_id: user._id
                    });
                });
            },

            edit: function (id) {
                if (!id) {
                    if ('settings' == App.route[0]) {
                        App.navigate('/edit/' + App.user._id);
                    }
                    else {
                        App.alert('ID is required');
                    }
                    return;
                }
                var model = new User.Model({_id: id}, {
                    query: {
                        select: ''
                    }
                });
                model.fetch({
                    success: function () {
                        App.getPlace('main').show(new User.EditForm({
                            model: model
                        }));
                    }
                });
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
                var pageable = new User.List([], {
                    query: {
                        type: 'user',
                        select: 'domain.surname.forename.name.country.city.city_id'
                    }
                });
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

            record: function () {
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
