"use strict";

App.module('Dock', function (Dock, App) {
    Dock.Model = Backbone.Model.extend({});

    Dock.List = Backbone.Collection.extend({
        model: function (attrs, options) {
            return new Dock.Model(attrs, options);
        }
    });

    Dock.View = Marionette.View.extend({
        template: '#view-dock-item',
        tagName: 'li',

        ui: {
            anchor: 'a'
        },

        events: {
            'click a': 'navigate'
        },

        onRender: function () {
            if (!this.model.get('enable')) {
                this.$el.addClass('unavailable');
            }
            this.ui.anchor
                .attr('href', this.model.get('href'))
                .attr('title', T(this.model.get('title')));
        },

        navigate: function (e) {
            e.preventDefault();
            App.navigate(this.model.get('enable')
                ? this.model.get('href')
                : '/unavailable');
        }
    });

    Dock.ListView = Marionette.CollectionView.extend({
        // tagName: 'ul',
        childView: Dock.View
    });

    Dock.Layout = Marionette.View.extend({
        template: '#view-dock',

        regions: {
            list: '.list'
        }
    });

    var items = {
        "news": "News",
        "profile": "Profile",
        "feedback": "Feedback",
        "dialogs": "Messages",
        "phone": "Call",
        "users": "Friend Search",
        "groups": "Groups",
        "photos": "Photos",
        "video": "Video",
        "conference": "Video",
        "audio": "Music",
        "settings": "Settings"
    };

    Dock.show = function () {
        var list = new Dock.List();
        for(var href in items) {
            var show = App.config.dock[href];
            list.add(new Dock.Model({
                href: '/' + href,
                enable: !!show,
                title: items[href]
            }));
        }
        var dock = new Dock.Layout();
        App.getPlace('dock').show(dock);
        dock.getRegion('list').show(new Dock.ListView({collection: list}));
        setTimeout(function () {
            document.getElementById('dock-container').classList.add('visible');
        }, 1200);
    };

    Dock.hide = function () {
        App.getPlace('dock').empty();
    };

    App.on('login', Dock.show);
    App.on('logout', Dock.hide);
});
