"use strict";

function Ajax(options) {
    _.extend(this, options);
    _.defaults(this, Ajax.options);
    this.defaults = options.defaults || {};
    _.defaults(this.defaults, Ajax.defaults);
}

Ajax.options = {
    base: '/',
    accept: 'application/json'
};

Ajax.defaults = {
    method: 'GET',
    type: 'json'
};

Ajax.promise = function (xhr) {
    return new Promise(function (resolve, reject) {
        function parse(xhr) {
            var data;
            try {
                data = JSON.parse(xhr.responseText);
            }
            catch (ex) {
            }
            return data;
        }

        xhr.addEventListener('load', function () {
            (xhr.status < 400 ? resolve : reject)(xhr);
        });
        xhr.addEventListener('error', function () {
            reject(xhr);
        });
    });
};

Ajax.params = function (object) {
    var array = [];
    for (var i in object) {
        array.push(i + '=' + object[i]);
    }
    return array.join('&')
};

Ajax.trace = function (promise) {
    promise
        .then(function (data, xhr) {
            console.log(data, xhr);
        })
        .catch(function (data, xhr) {
            console.error(xhr.status, data);
        })
};

Ajax.prototype = {
    createURL: function (options) {
        var url = this.base + (options.path || '');
        var params = options.params;
        if (!_.isEmpty(params)) {
            if ('object' == typeof params) {
                params = Ajax.params(params)
            }
            url += '?' + params;
        }
        return url;
    },

    createRequest: function (options) {
        if (!options) {
            options = {};
        }
        var xhr = new XMLHttpRequest();
        _.defaults(options, this.defaults);
        xhr.open(options.method, this.createURL(options));
        return xhr;
    },

    query: function (options) {
        var xhr = this.createRequest(options);
        xhr.setRequestHeader('accept', options.accept || this.accept);
        if (options.data) {
            xhr.send('json' == options.type ? JSON.stringify(options.data) : options.data);
        }
        else {
            xhr.send(null);
        }
        return Ajax.promise(xhr);
    },

    get: function (path, params) {
        return this.query({
            method: 'GET',
            path: path,
            params: params
        });
    },

    post: function (path, data) {
        return this.query({
            method: 'POST',
            path: path,
            data: data
        });
    },

    put: function (path, params, data) {
        return this.query({
            method: 'PUT',
            path: path,
            params: params,
            data: data
        });
    },

    delete: function (path, params) {
        return this.query({
            method: 'DELETE',
            path: path,
            params: params
        });
    },

    upload: function (path, data) {
        return this.query({
            method: 'POST',
            type: 'blob',
            path: path,
            data: data
        });
    }
};
