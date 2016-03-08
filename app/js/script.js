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

var socket_start = Date.now();

var server = {
    send: function (message) {
        if (arguments.length > 1) {
            message = arguments[0];
            message.target_id = arguments[1];
        }

        return new Promise(function (resolve, reject) {
            message.end = 0;
            if (server._socket && WebSocket.OPEN == server._socket.readyState) {
                _debug(message);
                server._socket.send(JSON.stringify(message));
                resolve(server._socket);
            }
            else if (server._socket) {
                console.error(SocketReadyState[server._socket.readyState]);
                reject(server._socket);
            }
            else {
                console.error('Socket does not exists');
                reject(server._socket);
            }
        });
    },

    poll: function () {
        if (server._socket && 1 == server._socket.readyState) {
            return;
        }

        var socket = new WebSocket('wss://' + location.hostname + '/socket');
        server._socket = socket;
        socket.addEventListener('open', function () {
            console.log('socket: open ' + (Date.now() - socket_start) / 1000);
            socket_start = Date.now();
        });
        socket.addEventListener('message', function (e) {
            var message = JSON.parse(e.data);
            _debug(message);
            server.fire(message.type, message);
        });
        socket.addEventListener('close', function () {
            var time = Date.now();
            var delta = time - socket_start;
                server._socket = null;
            console.warn('socket: close ' + delta / 1000);
            if (delta > 1000) {
                server.poll();
            }
            else {
                setTimeout(server.poll, 1000)
            }
            socket_start = time;
        });
        socket.addEventListener('error', function (e) {
            _error(e);
            server.poll();
        })
    }
};

extend(server, EventEmitter);

server.on('login', server.poll);
