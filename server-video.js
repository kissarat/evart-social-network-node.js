var fs = require('fs');
var mime = require('mime');
var ffmpeg = require('fluent-ffmpeg');
var ObjectID = require('mongodb').ObjectID;

module.exports = {
    index: function(_) {
        _.db.collection('message').aggregate([
            {
                $match: {
                    owner_id: _.url.query.owner_id ? ObjectID(_.url.query.owner_id) : _.user._id
                }
            },
            {$sort: {time: 1}}
        ])
            .toArray(_.anwser);
    },

    create: function(_) {
        var data = {
            _id: new ObjectId(),
            owner_id: _.user._id,
            title: _.body.title,
            type: 'video',
            created: Date.now()
        };
        _.db.collection('media').insertOne(data, _.wrap(function(result) {
            result.id = data._id;
            result.created = data.created;
            res.send(result);
        }));
    },

    upload: function(_) {
        var id = _.url.query.id;
        var filename = 'upload/' + id;
        fs.open(filename, _.wrap(function(fd) {
            _.req.on('data', function(data) {
                _.write(fd, data, _.wrap(function(written, string) {
                    if (written.length != data.byteLength) {
                        _.res.json(502, {
                            received: data.byteLength,
                            written: written
                        });
                    }
                }))
            });

            _.req.on('end', function() {
                _.collection('media').update(ObjectID(id), {$set: {uploaded: Date.now()}}, _.wrap(function(result) {
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
                                _.collection('media').update(ObjectID(id), {$set: {converted: Date.now()}}, _.answer);
                            });
                        })
                        .run();
                }));
            });
        }));
    }
};
