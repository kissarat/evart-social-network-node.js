'use strict';

App.module('Geo', function (Geo, App) {
    Geo.api = function (method, params, success) {
        return $.getJSON({
            url: '//api.vk.com/method/database.' + method + '?' + $.param(params),
            dataType: 'jsonp',
            jsonpCallback: 'vk',
            // ifModified: true,
            cache: true,
            success: success,
            headers: {
                'cache-control':'max-age=604800, public'
            }
        });
    };

    Geo.getCountries = function (success) {
        Geo.api('getCountries', {count: 1000, need_all: 1}, function (data) {
            success(data.response);
        });
    };

    Geo.getCountriesFragment = function (success) {
        Geo.getCountries(function (localized) {
            var fragment = document.createDocumentFragment();
            localized.items.forEach(function (country) {
                var c = _.find(countries, {_id: country.cid});
                if (c) {
                    var option = document.createElement('option');
                    option.innerHTML = country.title + ' ' + c.flag;
                    option.value = c.iso;
                    option.setAttribute('data-id', c._id);
                    fragment.appendChild(option);
                }
            });
            success(fragment);
        });
    };

    Geo.City = Backbone.Model.extend({
        idAttribute: 'cid',

        defaults: {
            count: 10,
            need_all: 0
        },

        getSearchQuery: function () {
            return _.pick(this.attributes, ['q', 'country_id', 'region_id', 'need_all', 'count']);
        }
    });

    Geo.CityView = Marionette.View.extend({
        template: '#view-city',
        cidPrefix: 'cityv',

        attributes: {
            'class': 'view view-city'
        },

        bindings: {
            '.title': 'title',
            '.area': {
                observe: 'area',
                onGet: function (value) {
                    return value ? value + ', ' : value;
                }
            },
            '.region': {
                observe: 'region',
                onGet: function (value) {
                    return value ? value.replace('область', 'обл.') : value;
                }
            }
        },

        events: {
            'click': 'select'
        },

        select: function (e) {
            if (this.model.collection) {
                this.model.collection.trigger('select', this.model);
            }
        },

        onRender: function () {
            this.stickit();
        }
    });

    Geo.CityListView = Marionette.CollectionView.extend({
        childView: Geo.CityView,
        cidPrefix: 'cityl',

        onRender: function () {
            var self = this;
            this.collection.on('select', function (model) {
                var id = model.get('cid');
                self.children.each(function (child) {
                    child.$el.toggleClass('selected', id === child.model.get('cid'));
                });
            });
        }
    });

    Geo.CitySearch = Marionette.View.extend({
        template: '#layout-city',
        cidPrefix: 'city-search',

        initialize: function () {
            // this.reset = this.reset.bind(this);
        },

        regions: {
            'list': '.list'
        },

        bindings: {
            '[type=search]': 'q'
        },

        events: {
            'keyup [type=search]': 'search',
            'search [type=search]': 'reset'
        },

        reset: function () {
            this.trigger('clear');
            this.getCollection().reset();
        },

        getCollection: function () {
            return this.getRegion('list').currentView.collection;
        },

        search: function (e) {
            var self = this;
            var collection = self.getCollection();

            function search() {
                Geo.api('getCities', self.model.getSearchQuery(), function (data) {
                    if (data.response.length > 0) {
                        collection.add(data.response);
                        self.model.set(data.response[0]);
                    }
                    else if (!self.model.get('need_all')) {
                        self.model.set('need_all', 1);
                        search();
                    }
                });
            }
            if (e && self.model.get('country_id') && EmptyKeys.indexOf(e.key) < 0) {
                var q = this.model.get('q');
                collection.reset();
                if (q) {
                    App.debounce(App.Geo, search);
                }
                else {
                    this.trigger('clear');
                }
            }
        },

        select: function (model) {
            this.model.set(model.attributes);
            this.model.set('q', model.get('title'));
        },

        onRender: function () {
            var self = this;
            this.getRegion('list').on('show', function () {
                self.getCollection().on('select', _.bind(self.select, self));
            });
            this.stickit();
        }
    }, {
        widget: function (region) {
            var citySearch = new Geo.CitySearch({model: new Geo.City()});
            region.show(citySearch);
            citySearch.getRegion('list').show(new Geo.CityListView({collection: new Backbone.Collection()}));
            return citySearch;
        }
    });
});
