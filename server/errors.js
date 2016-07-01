'use strict';

var code = require('./code');
// var utils = require('./utils');

class Response {
    // public code;
    // public data;

    constructor(code, data) {
        this.code = code;
        this.data = data;
    }

    toString() {
        return JSON.stringify(this.data);
    }
}

class BadRequest extends Response {
    constructor(invalid) {
        if (invalid instanceof Array) {
            invalid = utils.fields(invalid);
        }
        super(code.BAD_REQUEST, {
            invalid: invalid
        })
    }
}

class Forbidden extends Response {
    constructor(forbidden) {
        if (forbidden instanceof Array) {
            forbidden = utils.fields(forbidden);
        }
        super(code.FORBIDDEN, {
            forbidden: forbidden
        })
    }
}

class EntityTooLarge extends Response {
    constructor(maxLength) {
        super(code.REQUEST_TOO_LONG, {
            max: maxLength
        })
    }
}

module.exports = {Response, BadRequest, Forbidden, EntityTooLarge};
