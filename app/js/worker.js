function Client(port) {
    this.port = port;
    var client = this;
    port.addEventListener('message', function (e) {
        var message = JSON.parse(e.data);
        message.time = Date.now();
        client.last = message;
        var c;
        var id;

        function poll() {
            var found = null;
            var focus = function () {
                Client.broadcast({
                    type: 'poll',
                    window_id: c.id,
                    visible: 'visible' == c.last.state
                });
            };
            for (id in Client._all) {
                c = Client._all[id];
                if ('focus' == c.last.type && 'visible' == c.last.state) {
                    focus();
                    return;
                }
                if (!found || c.last.time > found.last.time) {
                    found = c;
                }
            }
            focus();
        }

        switch (message.type) {
            case 'open':
                client.id = message.window_id;
                Client._all[client.id] = client;
                var i = 0;
                for (id in Client._all) {
                    i++;
                }
                if (1 == i) {
                    poll();
                }
                break;

            case 'list':
                var activities = {};
                for (id in Client._all) {
                    c = Client._all[id];
                    activities[id] = c.last;
                }
                port.postMessage(JSON.stringify({
                    type: 'list',
                    clients: activities
                }));
                break;

            case 'close':
                delete Client._all[client.id];
                poll();
                break;

            case 'poll':
                poll();
                break;

            default:
                Client.broadcast(message);
                break;
        }
    });
    port.start();
}

Client._all = {};

Client.broadcast = function (message) {
    message.broadcast = true;
    var data = JSON.stringify(message);
    for (var id in Client._all) {
        Client._all[id].port.postMessage(data);
    }
};

onconnect = function (e) {
    new Client(e.ports[0]);
};
