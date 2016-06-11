"use strict";

App.setupError = function (name, reject) {
    if (reject) {
        return function (e) {
            console.error(name, e);
            reject(e);
        }
    }
    else {
        return function (e) {
            console.error(name, e);
        }
    }
};

function requestPromise(request, method) {
    return new Promise(function (resolve, reject) {
        request.addEventListener('success', function (e) {
            resolve(e.target.result);
        });
        request.addEventListener('error', App.setupError(method, reject));
    });
}

App.Database = Marionette.Object.extend({
    initialize: function (options) {
        var self = this;
        var request = indexedDB.open(options.name, options.version);
        request.addEventListener('success', function (e) {
            self.db = e.target.result;
            self.trigger('open', e.target.result);
        });
        request.addEventListener('error', App.setupError('IDBRequest'));
        request.addEventListener('upgradeneeded', function (e) {
            var schema = options.schema;
            var db = e.target.result;
            for (var name in schema) {
                db.createObjectStore(name, {keyPath: '_id'});
                // var storeSchema = schema[name];
                // for(var key in store) {
                //
                // }
            }
        })
    },

    /**
     *
     * @param name
     * @param mode
     * @returns IDBTransaction
     */
    transaction: function (name, mode) {
        if (!mode) {
            mode = 'readwrite';
        }
        var t = this.db.transaction(name, mode);
        t.addEventListener('error', App.setupError('IDBTransaction'));
        return t;
    },

    add: function (name, object) {
        object._id = _.hex_time();
        object.time = new Date(parseInt(object._id, 16)).toISOString();
        var request = this
            .transaction(name)
            .objectStore(name)
            .add(object);
        request.addEventListener('success', function () {
            localStorage.setItem(name + '_last', object._id);
        });
        request.addEventListener('error', App.setupError('add'));
        return request;
    },

    store: function (name) {
        return this
            .transaction(name)
            .objectStore(name);
    },

    getById: function (name, id) {
        return requestPromise(this.store(name).get(id), 'getById');
    },

    count: function (name) {
        return requestPromise(this.store(name).count(), 'count');
    },

    setupResolve: function (resolve) {
        return function (e) {
            resolve(e.target.result);
        }
    },

    insert: function (name, data) {

    }
});

App.local = new App.Database({
    name: 'local',
    version: 1,
    schema: {
        errors: {}
    }
});
