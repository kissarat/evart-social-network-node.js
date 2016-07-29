"use strict";
function Database(engine, options) {
    var self = this;
    _.extend(this, options);
    this.events = {};
    if (!engine) {
        engine = window.indexedDB ? 'IndexedDB' : 'LocalStorage';
    }
    this.engine = engine;
    if (options.error) {
        this.on('error', options.error);
    }

    _.each(Database[engine], function (method, name) {
        self[name] = method;
    });
    this.initialize(_.defaults(options || {}, {
        name: 'db',
        version: 1
    }));
    this.queryFromParams = options.queryFromParams || function (object) {
            return object;
        };
    addEventListener('beforeunload', function () {
        self.destroy();
    });

    this.id = 0;
}

Database.prototype = {
    on: function (event, handler) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(handler);
        return this.events[event].indexOf(handler) + 1;
    },

    trigger: function (event) {
        if (event in this.events) {
            var self = this;
            var args = [].slice.call(arguments, 1);
            this.events[event].forEach(function (cb) {
                cb.apply(self, args);
            });
        }
    },

    promise: function (event, request) {
        var self = this;
        return new Promise(function (resolve, reject) {
            request.addEventListener('success', function (e) {
                self.trigger(event, e.target.result, e);
                resolve.call(self, e.target.result, e);
            });
            request.addEventListener('error', function (e) {
                self.trigger('error', e, event);
                reject(e);
            })
        })
    },

    find: function (name, where) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var result = [];
            var match = _.matcher(where);
            self.iterate(name, function (cursor) {
                if (cursor) {
                    if (match(cursor.value)) {
                        result.push(cursor.value);
                    }
                    cursor.continue();
                }
                else {
                    resolve(result);
                }
            }, reject)
        });
    },

    _resolveObject: function (object) {
        if (object.attributes) {
            object = object.attributes;
        }
        if (!object._id) {
            object._id = this.createId();
            object.time = new Date().toISOString();
        }
        return object;
    },

    createId: function () {
        return ++this.id;
    },

    api: function (path, params) {
        var xhr = new XMLHttpRequest();
        xhr.open()
    },

    getById: function (name, id, params) {
        if (!id || 'string' !== typeof id) {
            throw new Error('Invalid id ' + id)
        }
        var self = this;
        var storage_name = name.replace(/\//g, '_');
        return new Promise(function (resolve, reject) {
            App.local.find(storage_name, {_id: id}).then(function (objects) {
                if (objects.length > 0) {
                    resolve(objects[0]);
                }
                else {
                    if (!params) {
                        params = {};
                    }
                    params.id = id;
                    switch (name) {
                        case 'user':
                            _.defaults(params, {
                                select: 'admin.domain.forename.surname.avatar'
                            });
                            break;
                    }
                    $.getJSON('/api/' + name + '?' + $.param(params))
                        .error(reject)
                        .success(function (object) {
                            resolve(object);
                            if (object) {
                                object._retrived = new Date().toISOString();
                                self.create(storage_name, object);
                            }
                        });
                }
            })
        });
    },

    fetch: function (name, where, params) {
        var self = this;
        assert.isString(name);
        assert.isObject(where);
        if (3 == arguments.length) {
            assert.isObject(params);
        }
        return new Promise(function (resolve, reject) {
            self.find(name, where).catch(reject).then(function (objects) {
                if (_.isEmpty(objects)) {
                    var url = '/api/' + name + '?' + $.param(_.merge(params, where));
                    $.getJSON(url, function (objects) {
                        assert.isArray(objects);
                        objects.forEach(function (object) {
                            self.put(name, object);
                        });
                        resolve(objects);
                    })
                }
                else {
                    resolve(objects);
                }
            })
        })
    },

    fetchOne: function (name, where, params) {
        var self = this;
        assert.isString(name);
        assert.isObject(where);
        if (3 == arguments.length) {
            assert.isObject(params);
        }
        return new Promise(function (resolve, reject) {
            self.find(name, where).catch(reject).then(function (objects) {
                if (0 == objects.length) {
                    if (!params) {
                        params = {select: Object.keys(where).join('.')};
                    }
                    var url = '/api/' + name + '?' + $.param(_.merge(params, where));
                    $.getJSON(url, function (object) {
                        assert.isObjectID(object._id);
                        self.put(name, object);
                        resolve(object);
                    })
                }
                else {
                    resolve(objects[0]);
                }
            })
        })
    }
};

Database.IndexedDB = {
    initialize: function (options) {
        var self = this;
        var request = indexedDB.open(options.name, options.version);
        this.promise('open', request).then(function (db) {
            self.db = db;
        });
        request.addEventListener('upgradeneeded', function (e) {
            self.db = e.target.result;
            self.upgrade(options.schema || {});
        })
    },

    upgrade: function (schema) {
        for (var name in schema) {
            var store = this.db.createObjectStore(name, {keyPath: '_id'});
            var storeSchema = schema[name];
            _.each(storeSchema.keys, function (key) {
                store.createIndex(key, key, {unique: true});
            });
            _.each(storeSchema.indexes, function (key) {
                store.createIndex(key, key, {unique: false});
            });
        }
    },

    handleError: function (name, request) {
        var self = this;
        request.addEventListener('error', function (e) {
            self.on('error', e, name);
        });
        return request;
    },


    transaction: function (name, isWrite) {
        return this.handleError('transaction',
            this.db.transaction(name, isWrite ? 'readwrite' : 'readonly')
        );
    },

    storage: function (name, isWrite) {
        return this
            .transaction(name, isWrite)
            .objectStore(name);
    },

    create: function (name, object) {
        return this.promise('create', this.storage(name, true).add(
            this._resolveObject(object)
        ));
    },

    update: function (name, object) {
        return this.promise('update', this.storage(name, true).put(
            this._resolveObject(object)
        ));
    },

    iterate: function (name, resolve, reject) {
        var request = this.storage(name, false).openCursor();
        request.addEventListener('success', function (e) {
            resolve(e.target.result);
        });
        request.addEventListener('error', reject);
    }
};

Database.LocalStorage = {
    initialize: function () {
        this.db = {};
        if (this.store) {
            for (var name in this.schema) {
                var _name = this._getStorageName(name);
                try {
                    this.db[name] = JSON.parse(localStorage.getItem(_name));
                }
                catch (ex) {
                    localStorage.removeItem(_name);
                }
            }
        }
    },

    storage: function (name) {
        return this.db[name] || (this.db[name] = {});
    },

    _put: function (name, object) {
        var storage = this.storage(name);
        return new Promise(function (resolve) {
            storage[object._id] = object;
            resolve(object)
        });
    },

    put: function (name, object) {
        object._retrived = new Date().toISOString();
        return this._put(name, object);
    },

    create: function (name, object) {
        this._put(name, object);
    },

    update: function (name, object) {
        this._put(name, object);
    },

    _store: function () {
        var self = this;
        _.each(this.db, function (value, name) {
            if (!_.isEmpty(value)) {
                value = JSON.stringify(value);
                localStorage.setItem(self._getStorageName(name), value);
            }
        })
    },

    destroy: function () {
        if (this.store) {
            try {
                this._store();
            }
            catch (ex) {
                this.drop();
            }
        }
    },

    _getStorageName: function (name) {
        return this.name + '.' + name;
    },

    iterate: function (name, resolve) {
        var storage = this.db[name];
        if (_.isEmpty(storage)) {
            resolve();
        }
        else {
            resolve(new Database.LocalStorage.Cursor(storage, {
                continue: function () {
                    this.i++;
                    resolve(this.i < this.values.length ? this : null);
                }
            }));
        }
    },

    drop: function (name) {
        if (name) {
            if (this.store) {
                localStorage.removeItem(this._getStorageName(name));
            }
            delete this.db[name];
        }
        else {
            for (name in this.db) {
                this.drop(name);
            }
        }
    }
};

Database.LocalStorage.Cursor = function Cursor(storage, options) {
    _.extend(this, options);
    this.i = 0;
    this.values = _.values(storage);
};

Database.LocalStorage.Cursor.prototype = {
    get value() {
        return this.values[this.i];
    }
};

App.local = new Database('LocalStorage', {
    name: 'socex',
    version: 1,
    schema: {
        errors: {},
        notification: {},
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
    },
    store: false,
    error: function (e) {
        console.error(e);
    }
});

function struct(schema) {
    var offset = 0;
    var prototype = {
        allocate: function () {
            return new ArrayBuffer(this.size);
        }
    };
    for (var key in schema) {
        void function (key, type, _offset) {
            if (!(type in struct.schema)) {
                throw new Error(key, type);
            }
            offset = _offset + struct.schema[type];
            var getter = 'get' + type;
            var setter = 'set' + type;
            Object.defineProperty(prototype, key, {
                get: function () {
                    return this.view[getter](_offset);
                },
                set: function (value) {
                    this.view[setter](_offset, value);
                }
            });
            prototype.size = offset;
        }(key, schema[key], offset);
    }
    function Struct(buffer) {
        if (!buffer) {
            buffer = this.allocate();
        }
        Object.defineProperty(this, 'view', {
            value: new DataView(buffer),
            enumerable: false,
            writable: false
        });
    }
    Struct.prototype = prototype;
    return Struct;
}

struct.schema = {
    Float32: 4,
    Float64: 8,
    Int8: 1,
    Int16: 2,
    Int32: 4,
    Uint8: 1,
    Uint16: 2,
    Uint32: 4
};
