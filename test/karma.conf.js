'use strict';

module.exports = function (config) {
    config.set({
        autoWatch: true,
        basePath: '',
        browsers: ['Chrome', 'PhantomJS', 'custom', 'Safari', 'Firefox'],
        client: {
            mocha: {
                reporter: 'html'
                // ui: 'tdd'
            }
        },
        colors: true,
        customLaunchers: {
            custom: {
                base: 'PhantomJS',
                options: {
                    windowName: 'socex-window',
                    settings: {
                        webSecurityEnabled: false
                    }
                },
                flags: ['--load-images=true'],
                debug: true
            }
        },
        concurrency: 1,
        exclude: [],
        files: ['browser/*.test.js'],
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
        preprocessors: {},
        reporters: ['mocha'],
        singleRun: false
    })
};
