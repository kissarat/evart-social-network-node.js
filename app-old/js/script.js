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
var socket_statistics = {};

function count_socket_statistics() {
    var s = {};
    for(var i in socket_statistics) {
        var code = socket_statistics[i];
        s[code] = (s[code] || 0 ) + 1;
    }
    return s;
}

var server = {
    send: function (message) {
        if (arguments.length > 1) {
            message = arguments[0];
            message.target_id = arguments[1];
        }

        return new Promise(function (resolve, reject) {
            message.end = 0;
            message = JSON.stringify(message);
            if (server._socket && WebSocket.OPEN == server._socket.readyState) {
                server._socket.send(message);
                resolve(server._socket);
            }
            else {
                if (server._socket) {
                    console.error(SocketReadyState[server._socket.readyState]);
                }
                else {
                    console.error('Socket does not exists');
                }

                if (!server._queue) {
                    server._queue = [];
                }
                server._queue.push(message);

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
            if (server._queue) {
                server._queue.forEach(function(message) {
                    socket.send(message);
                });
                server._queue = null;
            }
        });
        socket.addEventListener('message', function (e) {
            var message = JSON.parse(e.data);
            //_debug(message);
            server.fire(message.type, message);
        });
        socket.addEventListener('close', function (e) {
            var time = Date.now();
            var delta = time - socket_start;
            server._socket = null;
            //console.warn('socket: close ' + delta / 1000);
            socket_statistics[time] = e.code;
            if (delta < 2000) {
                setTimeout(function() {
                    server.poll();
                    socket_start = Date.now();
                }, Math.round(Math.random() * 8000));
            }
            else {
                server.poll();
                socket_start = time;
            }
        });
    }
};

extend(server, EventEmitter);

server.on('login', server.poll);
