"use strict";

function Entity(config, data) {
    if (!data) {
        data = config;
        config = null;
    }
    extend(this, data);
    if (!this.likes) {
        this.likes = [];
    }
    if (config) {
        if ('string' == typeof config) {
            config = {entity: config}
        }
        extend(this, config);
    }
}

Entity.resolve = function (config, object) {
    if (object instanceof Entity) {
        return object;
    }
    else {
        return new Entity(config, object);
    }
};

inherit(Entity, EventEmitter, {
    like: function () {
        var params = {
            entity: this.route,
            target_id: this.id
        };
        var self = this;
        var uid = localStorage.user_id;
        if (this.likes.indexOf(uid) < 0) {
            api('like', 'PUT', params, function (data) {
                if (data.nModified > 0) {
                    self.likes.push(uid);
                    self.fire('like', data);
                }
            });
        }
        else {
            api('like', 'DELETE', params, function (data) {
                if (data.nModified > 0) {
                    self.likes.splice(self.likes.indexOf(i), 1);
                    self.fire('like', data);
                }
            });
        }
    },

    handler: function (name) {
        var self = this;
        var args = array(arguments).slice(1);
        return function () {
            self[name].apply(self, args);
        }
    },

    get id() {
        return this._id;
    },

    get route() {
        return this.entity.toLowerCase();
    }
});


function Comment() {
}

Comment.resolve = function (object) {
    return Entity.resolve('Comment', object)
};

inherit(Comment, Entity);


function User(object) {
    Entity.call(this, config, object);
}

inherit(User, Entity, {
    get name() {
        return this.forename + ' ' + this.surname;
    }
});

extend(User, {
    _cache: {},

    resolve: function (object) {
        return Entity.resolve('User', object)
    },

    find: function (ids, call) {
        if (!(ids instanceof Array)) {
            ids = [ids];
        }
        var not_found = [];
        for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            if (id && !(id in User._cache)) {
                not_found.push(id);
            }
        }
        if (not_found.length > 0) {
            api('user/many', 'GET', {ids: not_found.join('.')}, function (data) {
                for (var i = 0; i < data.length; i++) {
                    var user = data[i];
                    User._cache[user._id] = new User(user);
                }
                call(User._cache);
            });
        }
        else {
            call(User._cache);
        }
    },

    findOne: function (id, call) {
        User.find(id, function (users) {
            call(users[id]);
        });
    },

    loadOne: function (id, cb) {
        api('user/view', 'GET', {id: id}, cb);
    },
    loadMe: function (call) {
        User.loadOne(localStorage.user_id, function (data) {
            me = data;
            if (call) {
                call();
            }
        });
    }
});
