var clients = {};

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
        if ('name' == event) {
            var client = clients[client_id];
            client.username = message.name;
            console.log(client.username, message);
            broadcast('enter', JSON.stringify(message));
        }
        else {
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
        var summary = {};
        for(var cid in clients) {
            var client = clients[cid];
            summary[cid] = client.username || cid;
        }
        clients[id] = $;
        var close = function () {
            if (id in clients) {
                console.log(id);
                delete clients[id];
                broadcast('exit', JSON.stringify({source_id: id}));
            }
        };
        $.req.on('close', close);
        $.res.on('close', close);
        $.res.on('finish', close);
        send(id, 'clients', JSON.stringify(summary));
    }
};
