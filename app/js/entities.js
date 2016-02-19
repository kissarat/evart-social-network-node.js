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

Entity.prototype = {
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
            api('like', 'DELETE', params, function(data) {
                if (data.nModified > 0) {
                    self.likes.splice(self.likes.indexOf(i), 1);
                    self.fire('like', data);
                }
            });
        }
    },

    handler: function(name) {
        var self = this;
        var args = array(arguments).slice(1);
        return function () {
            self[name].apply(self, args);
        }
    }
};

Object.defineProperties(Entity.prototype, {
    id: {
        get: function() {
            return this._id;
        }
    },
    route: {
        get: function() {
            return this.entity.toLowerCase();
        }
    }
});

extend(Entity.prototype, EventEmitter);

var Comment = {
    resolve: function(object) {
        return Entity.resolve('Comment', object)
    }
};