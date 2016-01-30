var sources;

module.exports = {
    GET: function (_) {
        var source = sources[_.req.query.target_id];
        if (source) {
            var subscriber = source.subscribers[_.req.user._id];
            if (!subscriber) {
                subscriber = _.res;
                source.subscribers[_.req.user._id] = subscriber;
                _.req.on('close', function () {
                    delete source.subscribers[this.user._id];
                });
            }
        }
        else {
            res.send(404, {message: 'Source not found'});
        }
    },

    POST: function (_) {
        var source = sources[_.user_id];
        if (!source) {
            source = {
                headers: {'Transfer-Encoding': 'chuncked'},
                subscribers: []
            };
            sources[_.user._id] = source;
            if ('content-type' in _.req.headers) {
                source.headers['Content-Type'] = _.req.headers['content-type'];
            }
        }
        source.chunck = _.body;
        source.subscribers.forEach(function (subscriber) {
            subscriber.writeHead(200, source.headers);
            subscriber.end(source.chunck);
        });
    }
};
