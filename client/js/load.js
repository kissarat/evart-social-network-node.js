"use strict";

if (window.supported) {
    addEventListener('load', load1_windowLoad);
}
else {
    console.error('Browser is not supported');
}

function load1_windowLoad() {
    statistics.load = Date.now() - statistics.start;

    if (false && matchMedia('min-width(769px)')) {
        var leftMenu = new App.Views.VerticalMenu();
        leftMenu.$el.hide();
        App.region.addLeftRegion.show(leftMenu);
        var rightMenu = new App.Views.VerticalMenu();
        rightMenu.$el.hide();
        App.addRightRegion.show(rightMenu);
        $('#root > .add').click(function (e) {
            var isLeft = this.classList.contains('left');
            (isLeft ? leftMenu : rightMenu).$el.toggle();
            (!isLeft ? leftMenu : rightMenu).$el.hide();
        });
    }

    $('#dock a')
        .click(function (e) {
            var href, region, widget;
            e.preventDefault();
            region = this.getAttribute('data-open');
            href = this.getAttribute('href');
            widget = App.widgets[href.slice(1)];
            if (region && widget) {
                $('#' + region).show();
                region = App[region + 'Region'];
                return widget(null, region);
            } else {
                return App.navigate(href);
            }
        })
        .on('mouseover', function () {
            _.each(document.querySelectorAll('#dock a.prev'), function (prev) {
                return prev.classList.remove('prev');
            });
            if (this.getAttribute('href')) {
                return this.classList.add('prev');
            }
        });

    var deferreds = _.toArray(document.querySelectorAll('.include[data-src]')).map(function (script) {
        return $.get(script.dataset.src, function (template) {
            script.innerHTML = template.replace(/>\s+</g, '><');
            script.removeAttribute('data-src');
        });
    });
    if (deferreds.length > 0) {
        $.when(deferreds).then(function () {
            load2_registerAgent.call(App);
        });
    }
    else {
        load2_registerAgent.call(App);
    }
}

function load2_registerAgent() {
    var self = this;
    addEventListener('beforeunload', App.sendStatistics);
    $.sendJSON('POST', '/api/agent', statistics, function (xhr) {
        var language;
        $('#boot-loading').hide();
        $('#root').show();
        if (xhr.status <= code.UNAUTHORIZED) {
            language = App.language;
            if (language && 'en' !== language) {
                document.documentElement.setAttribute('lang', language);
                $.getJSON("/languages/" + language + ".json", function (_dict) {
                    window.dictionary = _dict;
                    window.T = function (name) {
                        return dictionary[name] || name;
                    };
                    load3_languageLoaded.call(self, xhr);
                });
            } else {
                load3_languageLoaded.call(self, xhr);
            }
        } else {
            self.show(App.Views.Error, {
                title: 'Server Error',
                code: 502,
                text: 'Service Temporarily Unavailable'
            });
        }
    });
}

function load3_languageLoaded(xhr) {
    App.agent = xhr.responseJSON;
    App.isAuthorized = !!(code.UNAUTHORIZED !== xhr.status && App.agent.user);

    if (App.isAuthorized) {
        $('body').removeAttr('class');
        App.trigger('login');
    }
    else {
        setTimeout(function () {
            console.warn('User is not authorized');
            var first = App.route[0];
            if (['login', 'signup', 'users'].indexOf(first) != 0) {
                App.navigate('/login');
            }
        }, 0);
    }

    if (App.config.online) {
        setInterval(function () {
            App.updateOnline(App.config.online.duration + App.config.online.delay);
        }, App.config.online.duration);

        setTimeout(function () {
            App.updateOnline(App.config.online.duration);
        }, App.config.online.delay);
    }

    if (App.config.trace.history) {
        statistics.history = [];
    }

    Backbone.history.start({
        pushState: true,
        root: '/'
    });

    $.datepicker.setDefaults(
        $.extend(
            $.datepicker.regional[App.language],
            {'dateFormat':'yy-mm-dd'}
        )
    );

    App.start();

    /*
    if (navigator.serviceWorker) {
        navigator.serviceWorker.register('/service.js', {scope: '/'})
            .catch(function (e) {
                console.error('The service worker registration error ', e);
            })
        ;
    }
    */
}
