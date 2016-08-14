'use strict';

/*
Don't use Karma. It does not work


 "karma": "^1.*",
 "karma-chai": "^0.1.0",
 "karma-chrome-launcher": "^1.0.1",
 "karma-firefox-launcher": "^1.0.0",
 "karma-mocha": "^1.*",
 "karma-mocha-reporter": "^2.1.0",
 "karma-phantomjs-launcher": "^1.*",
 "karma-safari-launcher": "^1.0.0",
 "phantomjs-prebuilt": "^2.*",

*/

const ROOT = __dirname + '/..';

module.exports = function (config) {
    config.set({
        autoWatch: true,
        basePath: '',
        browsers: ['Chrome', 'PhantomJS', 'Safari', 'Firefox',
            'custom', 'devChrome'],
        client: {
            mocha: {reporter: 'html'},
            useIframe: false
        },
        colors: true,
        customLaunchers: {
            custom: {
                base: 'PhantomJS',
                options: {
                    windowName: 'socex-window',
                    settings: {webSecurityEnabled: false}
                },
                flags: ['--load-images=true'],
                debug: true
            },
            devChrome: {
                base: 'Chrome',
                flags: ['--auto-open-devtools-for-tabs'],
                chromeDataDir: 'browser-data/chrome'
                // clearContext: false
            }
        },
        concurrency: 1,
        customContextFile: ROOT + '/client/index.html',
        exclude: [],
        files: [
            // 'client/css/*.css',
            // "client/lib/underscore/underscore.js",
            // "client/lib/jquery/dist/jquery.js",
            // "client/lib/jquery-ui-bundle/jquery-ui.js",
            // "client/lib/jquery-ui/ui/i18n/datepicker-ru.js",
            // "client/lib/backbone/backbone.js",
            // "client/lib/backbone.paginator/lib/backbone.paginator.js",
            // "client/lib/backbone.radio/build/backbone.radio.js",
            // "client/lib/backbone.validation/dist/backbone-validation.js",
            // "client/lib/backbone.stickit/backbone.stickit.js",
            // "client/lib/backbone.marionette/lib/backbone.marionette.js",
            // "client/lib/moment/moment.js",
            // "client/js/polyfills.js",
            // "client/js/data.js",
            // "client/js/common.js",
            // "client/js/ui.js",
            // "client/js/main.js",
            // "client/js/database.js",
            // "client/js/socket.js",
            // "client/js/views.js",
            // "client/js/menu.js",
            // "client/js/dock.js",
            // "client/js/user.js",
            // "client/js/file.js",
            // "client/js/photo.js",
            // "client/js/video.js",
            // "client/js/message.js",
            // "client/js/peer.js",
            // "client/js/geo.js",
            // "client/js/load.js",
            // 'client/templates/*.html',
            // 'client/index.html',
            'test/browser/*.test.js'
        ]
        .map(file => ROOT + '/' + file),
        frameworks: ['mocha', 'chai'],
        logLevel: config.LOG_WARN,
        plugins: [
            'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-safari-launcher',
            // 'karma-iebrowsers-launcher',
            'karma-mocha-reporter',
            'karma-mocha',
            'karma-chai'
        ],
        port: 9876,
        proxies: {
            '/': 'http://localhost:8091/'
        },
        preprocessors: {},
        reporters: ['mocha'],
        singleRun: false,
        urlRoot: '/test/'
    })
};
