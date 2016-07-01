"use strict";

App.module('Views', function (Views, App) {
    Views.Router = Marionette.AppRouter.extend({
        appRoutes: {
            'empty': 'empty',
            'unavailable': 'unavailable',
            '': 'root',
            '*wtf': 'error'
        }
    });

    App.Behaviors.Bindings = Marionette.Behavior.extend({
        onRender: function () {
            this.view.$('a').click(function (e) {
                e.preventDefault();
                App.navigate(this.getAttribute('href'));
            });
            var clazz = this.view.template
                .replace('#thumbnail-', 'view thumbnail-')
                .replace('#layout-', 'view layout-')
                .replace('#form-', 'view form-')
                .replace('#view-', 'view ');
            this.view.$el.addClass(clazz);
            this.view.$('.unavailable').click(function () {
                return alert(T('This function is not available yet'));
            });
            var template = $(this.view.template);
            var cssClass = template.attr('data-class');
            document.body.removeAttribute('class');
            if (cssClass) {
                cssClass.split(/\s+/).forEach(function (className) {
                    if (className) {
                        document.body.classList.add(className);
                    }
                });
            }
            var el = this.view.el;
            if (App.dictionary) {
                ['h1', 'h2', 'legend', 'span', 'label', 'button', 'option', 'a', '.label', '[title]', '[placeholder]'].forEach(function (name) {
                    return _.each(el.querySelectorAll(name), function (element) {
                        var text;
                        text = element.childNodes.item(0);
                        if (element.getAttribute('title')) {
                            element.setAttribute('title', T(element.getAttribute('title')));
                        } else if (element.getAttribute('placeholder')) {
                            element.setAttribute('placeholder', T(element.getAttribute('placeholder')));
                        } else if (1 === element.childNodes.length && Node.TEXT_NODE === text.nodeType) {
                            text.textContent = T(text.textContent);
                        }
                    });
                });
            }
            this.view.stickit();
        }
    });

    App.Behaviors.Pageable = Marionette.Behavior.extend({
        onAttach: function () {
            var reverse = this.options.reverse;
            var view = this.view;
            var el = view.el.findParent(function (current) {
                return current.classList.contains('scroll');
            });
            el.addEventListener('scroll', function (e) {
                var delta = reverse ? e.target.scrollTop : e.target.scrollHeight - e.target.scrollTop;
                if (delta < 500) {
                    return view.collection.pageableCollection.getNextPage();
                }
            });
        }
    });

    Views.Error = Marionette.View.extend({
        template: '#view-error',
        cidPrefix: 'error',

        behaviors: {
            Bindings: {}
        },

        ui: {
            status: 'h1',
            code: '.code',
            text: 'p'
        },

        bindings: {
            'h1': 'title',
            '.text': 'text',
            '.code': 'code'
        }
    });

    Views.Alert = Marionette.View.extend({
        template: '#view-alert',

        ui: {
            message: '.message'
        },

        events: {
            'click .close': 'close'
        },

        close: function () {
            return this.model.collection.remove(this.model);
        },

        onRender: function () {
            this.$el.addClass('alert alert-' + this.model.get('type'));
            this.ui.message.html(this.model.get('message'));
            if (App.config.alert.duration > 0) {
                return setTimeout(this.close, App.config.alert.duration);
            }
        }
    });

    Views.AlertList = Marionette.View.extend({
        childView: Views.Alert
    });

    Views.Alert = Marionette.View.extend({
        template: '#view-alert',

        ui: {
            message: '.message'
        },

        events: {
            'click .close': 'close'
        },

        close: function () {
            this.model.collection.remove(this.model);
        },

        onRender: function () {
            this.el.classList.add('alert');
            this.el.classList.add('alert-' + this.model.get('type'));
            if (App.config.alert.duration > 0) {
                setTimeout(_.bind(this.close, this), App.config.alert.duration);
            }
        }
    });

    Views.AlertList = Marionette.CollectionView.extend({
        childView: Views.Alert
    });

    App.alert = function (type, message) {
        if (!message) {
            message = type;
            type = 'info';
        }
        var region = App.getRegion('alert');
        if (!region.currentView || !region.currentView.collection) {
            var collection = new Backbone.Collection();
            region.show(new Views.AlertList({collection: collection}));
        }
        region.currentView.collection.add(new Backbone.Model({
            type: type,
            message: message
        }));
    };

    App.show = function (View, data) {
        var region = App.getRegion('main');
        var view = new View({model: new Backbone.Model(data)});
        region.show(view);
    };

    Views.fileDialog = function (options) {
        if (!options) {
            options = {};
        }
        if (!options.id) {
            options.id = 'file-dialog';
        }
        var fileInput = document.getElementById(options.id);
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.setAttribute('id', options.id);
            fileInput.setAttribute('type', 'file');
            fileInput.setAttribute('style', 'display: none');
            document.body.appendChild(fileInput);
        }
        if (options.accept) {
            fileInput.setAttribute('accept', options.accept);
        }
        fileInput.multiple = !!options.multiple;
        return new Promise(function (resolve, reject) {
            fileInput.addEventListener('change', function (e) {
                var files = e.target.files;
                if (files.length > 0) {
                    resolve(files);
                }
                else {
                    reject(e);
                }
            });
            $(fileInput).click();
        });
    };

    Views.uploadDialog = function (options) {
        if (!options) {
            options = '/api/file';
        }
        if ('string' == typeof options) {
            options = {
                url: options,
                multiple: true
            }
        }
        var dialogOptions = {};
        ['multiple', 'accept'].forEach(function (name) {
            if (name in options) {
                dialogOptions[name] = options[name];
            }
        });
        options.promise = Views.fileDialog(dialogOptions);
        return new App.Upload(options);
    };

    Views.Panel = Marionette.View.extend({
        template: '#view-panel',

        ui: {
            controls: '.panel-controls'
        },

        regions: {
            content: '.panel-content'
        },

        onRender: function () {

        }
    });

    Views.PanelList = Marionette.CollectionView.extend({
        childView: Views.Panel,

        initialize: function () {
            this.stack = [];
        },

        add: function (view, enableControls) {
            var panel = new Views.Panel();
            this.addChildView(panel);
            panel.getRegion('content').show(view);
            if (enableControls) {
                panel.ui.controls[0].style.removeProperty('display');
            }
            return panel;
        }
    });

    Views.Empty = Marionette.View.extend({
        template: '#view-empty'
    });

    Views.Placeholder = Marionette.View.extend({
        template: '#view-empty',

        attributes: {
            'class': 'view-placeholder'
        }
    });

    Views.Unavailable = Marionette.View.extend({
        template: '#view-unavailable',

        attributes: {
            'class': 'unavailable'
        },

        ui: {
            back: '.back',
            message: '.message'
        },

        events: {
            '.back': backHistory
        },

        onRender: function () {
            this.ui.back.html(T('Back'));
            this.ui.message.html(T('Function unavailable'))
        }
    });

    new Views.Router({
        controller: {
            empty: function () {
                var placeholder = new Views.Placeholder();
                App.getPlace('main').add(placeholder, true);
            },

            unavailable: function () {
                var view = new Views.Unavailable();
                App.getPlace('main').show(view);
            },

            root: function () {
                App.navigate(App.user ? '/profile' : '/login');
            },

            error: function (code) {
                if (!code) {
                    code = 404;
                }
                var view = new Views.Error({
                    model: new Backbone.Model({
                        code: code,
                        text: "Whatever you were looking for doesn't currently exist at this address. " +
                        "Unless you were looking for this error page, in which case: Congrats! You totally found it."
                    })
                });
                App.getPlace('modal').show(view);
            }
        }
    });
});
