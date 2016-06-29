var request = require('request');
var utils = require('../utils');
var mongoose = require('mongoose');
var qs = require('querystring');

global.schema.Video = new mongoose.Schema({
    _id: {
        type: String,
        required: true
        // match: /^[_\-\w+]{3,10}$/
    },
    time: {
        type: Date,
        required: true,
        "default": Date.now
    },
    owner: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    author_url: String,
    provider_name: String,
    version: Number,
    provider_url: String,
    author_name: String,
    thumbnail_url: String,
    width: Number,
    height: Number,
    title: String,
    thumbnail_width: Number,
    thumbnail_height: Number,
    html: String
});

function load($) {
    var id = $.id;
    var oembed_url = 'https://www.youtube.com/oembed?format=json&url='
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
                            video = new Video(JSON.parse(b));
                            video._id = id;
                            video.save().then(resolve, reject);
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
    GET: load,

    POST: function ($) {
        return load($).then(function (video) {
            video = new Video(video);
            video.owner.push($.user._id);
            return video.save();
        });
    }
};