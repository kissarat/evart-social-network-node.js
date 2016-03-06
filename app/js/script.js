'use strict';

var config = {
    delay: {
        active: 1000,
        passive: 2000
    }
};

function sendParentWindow(data) {
    if (!isTopFrame()) {
        window.top.postMessage(data, '*');
        return true;
    }
    return false;
}

var _cookies = cookies.all();
var auth = _cookies.auth;
var client_id = _cookies.cid;

var server = {
    send: function (message) {
        if (server._socket || WebSocket.OPEN != server._socket.readyState) {
            server._socket.send(JSON.stringify(message));
        }
        else if (server._socket) {
            console.error(SocketReadyState[server._socket.readyState]);
        }
        else {
            console.error('Socket does not exists');
        }
    },

    poll: function () {
        if (server._socket && 1 == server._socket.readyState) {
            return;
        }

        var socket = new WebSocket('wss://' + location.hostname + '/socket');
        server._socket = socket;
        //socket.addEventListener('open', function () {});
        socket.addEventListener('message', function (e) {
            var message = JSON.parse(e.data);
            server.fire(message.type, message);
        });
        socket.addEventListener('close', function () {
            server._socket = null;
            server.poll();
        });
        socket.addEventListener('error', function (e) {
            _error(e);
            server.poll();
        })
    }
};

extend(server, EventEmitter);

server.on('login', function() {
    server.poll();
});
