var fs = require('fs');
var mime = require('mime');
var ffmpeg = require('fluent-ffmpeg');
var ObjectID = require('mongodb').ObjectID;

module.exports = {
    index: function(_) {
        _.db.collection('media').aggregate([
            {
                $match: {
                    owner_id: _.req.url.query.owner_id ? ObjectID(_.req.url.query.owner_id) : _.user._id
                }
            },
            {$sort: {time: 1}}
        ])
            .toArray(_.anwser);
    },

    PUT: function(_) {
        var data = {
            _id: Date.now(),
            owner_id: _.user._id,
            //title: _.body.title,
            type: 'video'
        };
        _.db.collection('media').insertOne(data, _.wrap(function(result) {
            _.res.send({
                id: data._id,
                result: result
            });
        }));
    },

    upload: function(_) {
        var id = _.req.url.route[1];
        var filename = 'upload/' + id;
        fs.open(filename, 'w', _.wrap(function(fd) {
            _.req.on('data', function(data) {
                console.log('length: ' + data.byteLength);
                fs.write(fd, data, 0, data.byteLength, _.wrap(function(written, string) {
                    //if (written.length != data.byteLength) {
                    //    _.res.send(502, {
                    //        received: data.byteLength,
                    //        written: written
                    //    });
                    //}
                }))
            });

            _.req.on('end', function() {
                fs.closeSync(fd);
                _.db.collection('media').update({_id: id}, {$set: {uploaded: Date.now()}}, _.wrap(function(result) {
                    ffmpeg(filename)
                        .audioBitrate('96k')
                        .audioFrequency(22050)
                        .audioFilters({
                            filter: 'silencedetect',
                            options: { n: '-50dB', d: 5 }
                        })
                        .videoCodec('libx264')
                        .videoBitrate(680)
                        .fps(29.7)
                        .output('video/' + id + '.mp4')
                        .on('end', function() {
                            fs.unlink(filename, function() {
                                _.db.collection('media').update({_id: id}, {$set: {converted: Date.now()}}, _.answer);
                            });
                        })
                        .run();
                }));
            });
        }));
    }
};
