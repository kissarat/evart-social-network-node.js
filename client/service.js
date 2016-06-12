"use strict";

// var SOCEX_CACHE_NAME = 'socex';

['install', 'activate', 'fetch', 'message', 'notificationclick', 'notificationclose', 'push', 'sync'].forEach(function (name) {
    self.addEventListener(name, function (e) {
        // console.log(e);
    });
});
