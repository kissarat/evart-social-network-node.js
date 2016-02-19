function Client(port) {
    this.port = port;
    this.last = {};
    var self = this;
    port.addEventListener('message', function (e) {
        var message = JSON.parse(e.data);
        if (message.time && message.time == self.last.time) {
            return;
        }
        else if (!message.time) {
            message.time = Date.now();
        }
        self.last = message;
        var client;
        var id;

        function poll() {
            var found = null;
            var focus = function () {
                Client.broadcast({
                    type: 'poll',
                    window_id: client.id,
                    visible: 'visible' == client.last.state
                });
            };
            for (id in Client._all) {
                client = Client._all[id];
                if ('focus' == client.last.type && 'visible' == client.last.state) {
                    focus();
                    return;
                }
                if (!found || client.last.time > found.last.time) {
                    found = client;
                }
            }
            focus();
        }

        switch (message.type) {
            case 'open':
                self.id = message.window_id;
                Client._all[self.id] = self;
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
                    client = Client._all[id];
                    activities[id] = client.last;
                }
                port.postMessage(JSON.stringify({
                    type: 'list',
                    clients: activities
                }));
                break;

            case 'close':
                delete Client._all[self.id];
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
