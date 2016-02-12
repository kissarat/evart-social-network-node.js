'use strict';

var MongoClient = require('mongodb').MongoClient;
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var path = require('path');
var _static = path.normalize(__dirname + '/../static');

function query(collection, call) {
    MongoClient.connect('mongodb://localhost:27017/socex', function (err, _db, done) {
        if (err) {
            console.error(err);
        }
        else if (_db) {
            call(_db.collection(collection));
        }
    });
}

query('media', function (media) {
    media.findOne({status: 'uploaded', type: 'video'}, function (err, result) {
        if (!result) {
            process.exit();
        }
        var id = result._id;
        var filename = _static + '/upload/video/' + id;
        if (fs.existsSync(filename)) {
            console.log(new Date() + ': ' + result._id + '. ' + result.title);
            convert(result, filename);
        }
        else {
            console.error('not exists\t' + filename);
            query('media', function (media) {
                media.deleteOne({_id: id}, function (err, result) {
                    console.log('deleted\t' + JSON.stringify(result));
                    process.exit();
                });
            });
        }
    })
});

function convert(info, filename) {
    ffmpeg(filename)
        .audioBitrate('96k')
        .audioFrequency(22050)
        .audioFilters({
            filter: 'silencedetect',
            options: {n: '-50dB', d: 5}
        })
        .videoCodec('libx264')
        .videoBitrate(680)
        //.fps(23.976)
        .screenshots({
            timestamps: ['50%'],
            folder: _static + '/video/thumbnail',
            filename: info._id + '.jpg',
            size: '480x320'
        })
        .output(_static + '/video/' + info._id + '.mp4')
        .on('codecData', function (data) {
            console.log(data);
            query('media', function (media) {
                media.update({_id: info._id}, {$set: {input: data}});
            })
        })
        .on('process', function (process) {
            console.log(JSON.stringify(process))
        })
        .on('error', function (error) {
            console.error(error)
        })
        .on('end', function () {
            fs.unlink(filename, function () {
                query('media', function (media) {
                    media.update({_id: info._id}, {
                        $set: {
                            converted: Date.now(),
                            status: 'done'
                        }
                    }, function (err, r) {
                        console.log('done ' + new Date() + ': ' + id + '. ' + info.title);
                        db.close();
                    })
                });
            });
        })
        .run();
}

