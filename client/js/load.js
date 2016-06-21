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

    // var deferreds;
    // $('#select-language').val(App.language).change(function (e) {
    //     $.cookie('lang', e.target.value, {
    //         expires: 365,
    //         path: '/'
    //     });
    //     return location.reload();
    // });
    if (DEV) {
        var deferreds = [];
        $('[data-src]').each(function (i, script) {
            return deferreds.push($.get(script.dataset.src, function (template) {
                script.innerHTML = template.replace(/>\s+</g, '><');
                return script.removeAttribute('data-src');
            }));
        });
        return $.when(deferreds).then(function () {
            load2_registerAgent.call(App);
        });
    } else if (window.addEventListener && navigator.sendBeacon) {
        addEventListener('beforeunload', function () {
            return navigator.sendBeacon('/api/statistics', JSON.stringify(statistics));
        });
        load2_registerAgent.call(App);
    }
}

function load2_registerAgent() {
    var self = this;
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
                text: 'Service Temporarily Unavailable'
            });
        }
    });
}

function load3_languageLoaded(xhr) {
    App.agent = xhr.responseJSON;
    var isAuthorized = !!(code.UNAUTHORIZED !== xhr.status && App.agent.user);

    if (isAuthorized) {
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

    setInterval(function () {
        App.updateOnline(App.config.online.duration + App.config.online.delay);
    }, App.config.online.duration);
    
    setTimeout(function () {
        App.updateOnline(App.config.online.duration);
    }, App.config.online.delay);

    Backbone.history.start({
        pushState: true,
        root: '/'
    });

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
