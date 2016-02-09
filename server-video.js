var fs = require('fs');

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
            .toArray(_.answer);
    },

    PUT: function(_) {
        var data = {
            _id: Date.now(),
            owner_id: _.user._id,
            title: _.body.title,
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
        var id = parseFloat(_.req.url.route[1]);
        var filename = 'upload/' + id;
        fs.open(filename, 'w', _.wrap(function(fd) {
            _.req.on('data', function(data) {
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
                var summary = {
                    id: id,
                    info: {uploaded: Date.now(), status: 'uploaded'}
                };
                _.db.collection('media').update({_id: id}, {$set: summary.info}, _.wrap(function(result) {
                    summary.result = result;
                    _.res.send(summary);
                }));
            });
        }));
    }
};
