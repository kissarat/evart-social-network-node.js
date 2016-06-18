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

function _resolveObject(object) {
    if (object.attributes) {
        object = object.attributes;
    }
    if (!object._id) {
        object._id = _.hex_time();
        object.time = new Date(parseInt(object._id, 16)).toISOString();
    }
    return object;
}

if (window.indexedDB) {
    App.Database = Marionette.Object.extend({
        initialize: function (options) {
            var self = this;
            var request = indexedDB.open(options.name, options.version);
            request.addEventListener('error', function (e) {
                console.error(e);
            });
            request.addEventListener('success', function (e) {
                self.db = e.target.result;
                self.trigger('open', e.target.result);
            });
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
            object = _resolveObject(object);
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
}
else {
    App.Database = Marionette.Object.extend({
        initialize: function () {
            this.db = {};
        },

        store: function (name) {
            if (!(name in this.db)) {
                this.db[name] = {};
            }
            return this.db[name];
        },

        add: function (name, object) {
            object = _resolveObject(object);
            var storage = this.store(name);
            return new Promise(function (resolve) {
                storage[object._id] = object;
                resolve(object)
            });
        },

        getById: function (name, id) {
            var storage = this.store(name);
            return new Promise(function (resolve) {
                resolve(storage[id]);
            });
        }
    });
}

App.local = new App.Database({
    name: 'socex',
    version: 1,
    schema: {
        errors: {},
        file: {},
        message: {},
        user: {},
        video: {}
    }
});


var _getById = App.local.getById;
App.local.getById = function (name, id) {
    var self = this;
    return new Promise(function (resolve, reject) {
        _getById.call(self, name, id).then(function (object) {
            if (object) {
                resolve(object);
            }
            else {
                $.getJSON('/api/' + name + '?id=' + id)
                    .error(reject)
                    .success(function (object) {
                        resolve(object);
                        if (object) {
                            object._retrived = new Date().toISOString();
                            self.add(name, object);
                        }
                    });
            }
        })
    });
};
