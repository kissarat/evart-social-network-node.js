'use strict';

var MongoClient = require('mongodb').MongoClient;
var ffmpeg = require('fluent-ffmpeg');
var db;

MongoClient.connect('mongodb://localhost:27017/socex', function (err, _db, done) {
    db = _db;
    db.collection('media').findOne({status: 'uploaded', type: 'video'}, function (err, result) {
        if (err) {
            return console.log(err);
        }
        if (!result) {
            return db.close();
        }
        console.log(new Date() + ': ' + result.id + '. ' + result.title);
        var id = result.id;
        var filename = 'upload/' + id;
        ffmpeg(filename)
            .audioBitrate('96k')
            .audioFrequency(22050)
            .audioFilters({
                filter: 'silencedetect',
                options: {n: '-50dB', d: 5}
            })
            .videoCodec('libx264')
            .videoBitrate(680)
            .fps(29.7)
            .output('video/' + id + '.mp4')
            .on('end', function () {
                fs.unlink(filename, function () {
                    _.db.collection('media')
                        .update({_id: id}, {$set: {converted: Date.now(), status: 'done'}}, function(err, r) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                console.log('done ' + new Date() + ': ' + result.id + '. ' + result.title);
                            }
                            db.close();
                        });
                });
            })
            .run();
    })
});
