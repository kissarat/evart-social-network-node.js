'use strict';

var code = require('./code');
var utils = require('./utils');

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

module.exports = utils.export([Response, Forbidden]);
