"use strict";

App.module('Menu', function (Menu, App) {
    Menu.OpenView = Marionette.View.extend({
        template: '#view-open-vertical-menu',

        regions: {
            container: '.menu-container'
        },

        ui: {
            container: '.menu-container'
        },

        events: {
            'click': 'open'
        },

        open: function () {
            Menu.closeAll();
            var region = this.getRegion('container');
            if (!region.currentView) {
                region.show(new Menu.View({model: this.model}));
            }
        }
    });

    Menu.View = Marionette.View.extend({
        template: '#view-vertical-menu',

        tagName: 'ul',

        ui: {
            dialogs: '[data-name=dialogs]',
            video: '[data-name=video]'
        },

        events: {
            'click li': 'open'
        },

        open: function (e) {
            var options = e.target.getAttribute('data-options');
            if (options) {
                options = JSON.parse(options);
            }
            App.widget(this.getSideRegion(), e.target.getAttribute('data-widget'), options);
            Menu.closeAll();
        },

        onRender: function () {
            var self = this;
            _.each(App.config.menu, function (enable, name) {
                if (enable) {
                    self.ui[name].removeClass('hidden');
                }
            })
        },

        getSideRegion: function () {
            return App.getPlace(this.model.get('place'));
        },

        getMenuContainer: function () {
            return App.getPlace('left' === this.model.get('place') ? 'addLeft' : 'addRight')
                .currentView.getRegion('container');
        }
    });

    Menu.closeAll = function () {
        App.getPlace('addLeft').currentView.getRegion('container').empty();
        App.getPlace('addRight').currentView.getRegion('container').empty();
    };

    App.on('login', function () {
        var openLeft = new Menu.OpenView({model: new Backbone.Model({place: 'left'})});
        App.getPlace('addLeft').show(openLeft);
        var openRight = new Menu.OpenView({model: new Backbone.Model({place: 'right'})});
        App.getPlace('addRight').show(openRight);
    });

    App.on('logout', function () {
        App.getPlace('addLeft').empty();
        App.getPlace('addRight').empty();
    });
});
