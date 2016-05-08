class Iterator {
    constructor(array = []) {
        this.i = -1;
        this.array = array;
    }

    get current() {
        return this.array[this.i];
    }

    next() {
        this.i++;
        return this.current;
    }

    rewind() {
        this.i = -1;
    }

    get can() {
        return this.i < this.array.length - 1;
    }
}

function fields(array) {
    var object = {};
    for (var i = 0; i < array.length; i++) {
        var field = array[i];
        object[field.name] = field.value;
    }
    return object;
}

function merge() {
    var object = {};
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        for (var key in arg) {
            object[key] = arg[key];
        }
    }
    return object;
}

var exports = {
    export: function(classes) {
        var exports = {};
        for (var i = 0; i < classes.length; i++) {
            var clazz = classes[i];
            exports[clazz.name] = clazz
        }
        return exports;
    }
};

module.exports = merge(exports, exports.export([Iterator, fields, merge]));
