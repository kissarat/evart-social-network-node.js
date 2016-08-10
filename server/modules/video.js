'use strict';

const request = require('request');
const utils = require('../utils');
const mongoose = require('mongoose');
const qs = require('querystring');

const _schema = {
    _id: {
        type: String,
        required: true
        // match: /^[_\-\w+]{3,10}$/
    },

    created: CreationDateType,
    time: CreationDateType,

    owner: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    author_url: utils.StringType(),
    provider_name: utils.StringType(),
    version: {
        type: Number,
        min: 0
    },
    provider_url: utils.StringType(),
    author_name: utils.StringType(),
    thumbnail_url: utils.StringType(),
    width: {
        type: Number,
        min: 0
    },
    height: {
        type: Number,
        min: 0
    },
    title: utils.StringType(),
    thumbnail_width: {
        type: Number,
        min: 0
    },
    thumbnail_height: {
        type: Number,
        min: 0
    },
    html: utils.StringType()
};

global.schema.Video = new mongoose.Schema(_schema, utils.merge(config.mongoose.schema.options, {
    collectionName: 'video'
}));

function load($) {
    const id = $.id;
    const oembed_url = 'https://www.youtube.com/oembed?format=json&url='
        + qs.escape('https://www.youtube.com/watch?v=' + id);
    return new Promise(function (resolve, reject) {
        if (oembed_url) {
            Video.findOne({_id: id}).then(function (video) {
                if (video) {
                    resolve(video);
                }
                else {
                    request(oembed_url, function (err, r, b) {
                        if (err) {
                            reject(err);
                        } else {
                            if (r.statusCode >= 400) {
                                reject(r.statusCode, {
                                    url: oembed_url,
                                    message: b
                                });
                            }
                            else {
                                video = new Video(JSON.parse(b));
                                video._id = id;
                                video.save().then(resolve, reject);
                            }
                        }
                    });
                }
            }, reject);
        } else {
            reject('Unknown service');
        }
    });
}

module.exports = {
    _meta: {
        schema: _schema
    },

    GET: function ($) {
        if ($.has('owner_id')) {
            return Video.find({owner: $.get('owner_id')});
        }
        else if ($.has('id')) {
            return load($);
        }
        else {
            return Video.find({});
        }
    },

    POST: function ($) {
        return load($).then(function (video) {
            video = new Video(video);
            video.owner.push($.user._id);
            return video.save();
        });
    }
};
