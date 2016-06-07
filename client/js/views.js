"use strict";

App.module('Views', function (Views, App) {
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
                document.body.classList.add(cssClass);
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

    Views.Error = Marionette.View.extend({
        template: '#view-error',

        behaviors: {
            Bindings: {}
        },

        ui: {
            status: 'h1',
            text: 'p'
        },

        bindings: {
            'h1': 'status',
            '.text': 'text'
        }
    });

    App.Behaviors.Pageable = Marionette.Behavior.extend({
        onAttach: function () {
            var view = this.view;
            var el = view.el.findParent(function (current) {
                return current.classList.contains('scroll');
            });
            return el.addEventListener('scroll', function (e) {
                var delta = e.target.scrollHeight - e.target.scrollTop;
                if (delta < 500) {
                    return view.collection.pageableCollection.getNextPage();
                }
            });
        }
    });

    Views.Upload = Marionette.View.extend({
        template: '#view-upload',

        ui: {
            file: '[type=file]'
        },

        events: {
            'change [type=file]': 'upload'
        },

        upload: function () {
            var self = this;
            var files = _.toArray(this.ui.file[0].files);

            function _upload() {
                var file;
                file = files.shift();
                if (file) {
                    App.upload('/api/photo', file).then(function (photo, e) {
                        var message;
                        if (photo) {
                            return self.trigger('uploaded', new App.Models.Photo(photo));
                        } else {
                            message = (function () {
                                switch (e.target.status) {
                                    case code.REQUEST_TOO_LONG:
                                        return 'is too large';
                                    default:
                                        return 'unknown error';
                                }
                            })();
                            return error_message(self.el, file.name + ' ' + T(message));
                        }
                    });
                    return _upload();
                }
            }
            _upload();
        }
    });

    Views.PhotoThumbnail = Marionette.View.extend({
        template: '#view-photo-thumbnail',

        ui: {},

        attributes: {
            'class': 'photo-thumbnail thumbnail'
        },

        events: {
            'click': function () {
                return this.trigger('select');
            }
        },

        onRender: function () {
            return this.$el.css('background-image', "url(/photo/" + (this.model.get('_id')) + ".jpg)");
        }
    });

    Views.VerticalMenu = Marionette.View.extend({
        template: '#view-vertical-menu',

        tagName: 'ul',

        ui: {
            messages: '[data-name=messages]',
            video: '[data-name=video]'
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

    Views.Button = Backbone.View.extend({
        setText: function (value) {
            this.el.innerHTML = T(value);
        }
    });

    Views.Collection = Backbone.View.extend({
        constructor: function (options) {
            if (!options) {
                options = {};
            }
            Backbone.View.call(this, options);
            this.children = options.children || [];
        },

        render: function () {
            this.el.innerHTML = '';
            this.children.forEach(function (child) {
                child.render();
                this.appendChild(child.el);
                console.log(child.el);
            });
            return this;
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
    
    Views.Error = Marionette.View.extend({
        template: '#view-error',

        behaviors: {
            Bindings: {}
        },
        
        bindings: {
            'h1': 'title',
            '.text': 'text'
        }
    });

    App.show = function (View, data) {
        var region = App.getRegion('main');
        var view = new View({model: new Backbone.Model(data)});
        region.show(view);
    };
});
