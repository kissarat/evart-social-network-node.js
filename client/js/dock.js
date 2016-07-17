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

        onRender: function () {
            this.ui.anchor
                .attr('href', this.model.get('href'))
                .attr('title', T(this.model.get('title')));
        }
    });

    Dock.ListView = Marionette.CollectionView.extend({
        // tagName: 'ul',
        childView: Dock.View,

        events: {
            'click a': 'navigate'
        },

        navigate: function (e) {
            e.preventDefault();
            App.navigate(e.target.getAttribute('href'));
        }
    });

    Dock.Layout = Marionette.View.extend({
        template: '#view-dock',

        regions: {
            list: '.list'
        }
    });

    var items = {
        "feed": "News",
        "profile": "Profile",
        "feedback": "Feedback",
        "dialogs": "Messages",
        "phone": "Call",
        "list/friend": "Friends",
        "groups": "Groups",
        "photos": "Photos",
        "video": "Video",
        "conference": "Video",
        "audio": "Music",
        "settings": "Settings"
    };

    App.on('login', function () {
        var list = new Dock.List();
        for(var href in items) {
            if (App.config.dock[href]) {
                list.add(new Dock.Model({
                    href: '/' + href,
                    title: items[href]
                }));
            }
        }
        var dock = new Dock.Layout();
        App.getPlace('dock').show(dock);
        dock.getRegion('list').show(new Dock.ListView({collection: list}));
    });

    App.on('logout', function () {
        App.getPlace('dock').empty();
    });
});
