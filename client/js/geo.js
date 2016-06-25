App.module('Geo', function (Geo, App) {
    Geo.api = function (method, params, success) {
        return $.getJSON({
            url: '//api.vk.com/method/database.' + method + '?' + $.param(params),
            dataType: 'jsonp',
            jsonpCallback: App.jsonpCallback('vk'),
            success: success
        });
    };
    
    Geo.getCountries = function (success) {
        Geo.api('getCountries', {count: 1000, need_all: 1}, function (data) {
            success(data.response);
        });
    };
    
    Geo.getCountriesFragment = function (success) {
        Geo.getCountries(function (localized) {
            var fragment = document.createDocumentFragment('fragment');
            localized.forEach(function (country) {
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
    
    Geo.CityView = Marionette.View.extend({
        template: '#view-city',
        cidPrefix: 'cityv',

        attributes: {
            'class': 'view view-city'
        },

        onRender: function () {
            this.stickit();
        }
    });

    Geo.CityListView = Marionette.CollectionView.extend({
        childView: Geo.CityView,
        cidPrefix: 'cityl'
    });

    Geo.CitySearch = Marionette.View.extend({
        template: '#layout-city',
        cidPrefix: 'city-search',

        initialize: function () {
            this.search = _.debounce(_.bind(this.search, this), 300);
        },

        regions: {
            'list': '.list'
        },

        bindings: {
            '[type=search]': 'q'
        },

        events: {
            'keyup [type=search]': 'search'
        },

        getCollection: function () {
            return this.getRegion('list').currentView.collection;
        },

        search: function (e) {
            var self = this;
            if (this.model.get('country_id') && EmptyKeys.indexOf(e.keyCode) < 0) {
                Geo.api('getCities', this.model.attributes, function (data) {
                    self.getCollection().add(data.response.items);
                });
            }
        },

        onRender: function () {
            this.stickit();
        }
    }, {
        widget: function (region) {
            var citySearch = new Geo.CitySearch({model: new Backbone.Model()});
            region.show(citySearch);
            citySearch.getRegion('list').show(new Geo.CityListView({collection: new Backbone.Collection()}));
            return citySearch;
        }
    })
});
