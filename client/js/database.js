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
                    var store  =db.createObjectStore(name, {keyPath: '_id'});
                    var storeSchema = schema[name];
                    _.each(storeSchema.keys, function (key) {
                        store.createIndex(key, key, {unique: true});
                    });
                    _.each(storeSchema.indexes, function (key) {
                        store.createIndex(key, key, {unique: false});
                    });
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
            var t = this.db.transaction(name, mode ? 'readwrite' : 'readonly');
            t.addEventListener('error', App.setupError('IDBTransaction'));
            return t;
        },

        add: function (name, object) {
            object = _resolveObject(object);
            var request = this
                .transaction(name, true)
                .objectStore(name)
                .add(object);
            request.addEventListener('success', function () {
                localStorage.setItem(name + '_last', object._id);
            });
            request.addEventListener('error', App.setupError('add'));
            return request;
        },

        put: function (name, object) {
            object = _resolveObject(object);
            var request = this
                .transaction(name, true)
                .objectStore(name)
                .put(object);
            request.addEventListener('error', App.setupError('put'));
            return request;
        },

        store: function (name, mode) {
            return this
                .transaction(name, mode)
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

        iterate: function (name, mode) {
            return requestPromise(this.store(name, mode).openCursor());
        }
    });
}
else {
    var _put = function (name, object) {
        object = _resolveObject(object);
        var storage = this.store(name);
        return new Promise(function (resolve) {
            storage[object._id] = object;
            resolve(object)
        });
    };
    
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

        add: _put,
        put: _put,

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
        file: {
            indexes: ['md5']
        },
        message: {
            indexes: ['source', 'target']
        },
        user: {
            keys: ['domain']
        },
        video: {},
        photo: {},
        user_informer: {}
    }
});


var _getById = App.local.getById;
App.local.getById = function (name, id) {
    var self = this;
    var storage_name = name.replace(/\//g, '_');
    return new Promise(function (resolve, reject) {
        _getById.call(self, storage_name, id).then(function (object) {
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
                            self.add(storage_name, object);
                        }
                    });
            }
        })
    });
};

App.local.find = function (name, where) {
    var self = this;
    return new Promise(function (resolve, reject) {
        var result = [];
        var match = _.matcher(where);
        self.iterate(name).catch(reject).then(function (cursor) {
            if (cursor) {
                if (match(cursor.value)) {
                    result.push(cursor.value);
                }
                cursor.continue();
            }
            else {
                resolve(result);
            }
        });
    });
};
