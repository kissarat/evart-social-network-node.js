var clients = {};

function unsafe_uid() {
    return Math.round(Math.random() * 1679615).toString(36);
}

var i = 0;

function send(id, event, data) {
    var res = clients[id].res;
    res.write(`event: ${event}\n`);
    res.write(`data: ${data}\n`);
    res.write(`id: ${++i}\n\n`);
}

function broadcast(event, data) {
    for (var id in clients) {
        send(id, event, data);
    }
}

module.exports = {
    POST: function ($) {
        var id = $.req.url.query.id;
        var client_id = $.req.client_id.toString();
        var event = $('event');
        var message = $.body;
        message.source_id = client_id;
        var data = JSON.stringify(message);

        console.log(id, event);
        if (id) {
            if (id in clients) {
                send(id, event, data);
            }
        }
        else {
            broadcast(event, data);
        }
        $.res.end();
    },

    GET: function ($) {
        $.req.socket.setNoDelay(true);
        var id = $.req.client_id.toString();
        var headers = {
            'content-type': 'text/event-stream',
            'cache-control': 'no-cache',
            'transfer-encoding': 'identity',
            'x-accept-buffering': 'no',
            'connection': 'keep-alive'
        };
        for(var name in headers) {
            $.res.setHeader(name, headers[name]);
        }
        $.res.write(':ok\n\n');
        var me = JSON.stringify({source_id: id});
        broadcast('enter', me);
        clients[id] = $;
        var summary = {};
        for(var client_id in clients) {
            summary[client_id] = null;
        }
        send(id, 'clients', JSON.stringify(summary));
        var close = function () {
            delete clients[id];
            broadcast('exit', me);
        };
        $.req.on('close', close);
        $.res.on('finish', close);
    }
};
