"use strict";
var http = require('http');
var fs = require('fs');
var banlist = fs.readFileSync(__dirname + '/../client/pages/404.html');
banlist = banlist.toString('utf8').split('\n').map(d => d.trim());
var banlist_file = fs.openSync(__dirname + '/../client/banlist.txt', 'w');
var not_found = fs.readFileSync(__dirname + '/../client/pages/404.html');
var socket_file = '/tmp/socex-ban.sock';

var server = http.createServer(function (req, res) {
    var ip = req.headers.ip;
    if (banlist.indexOf(ip) < 0) {
        fs.write(banlist_file, ip + '\n', function () {
            banlist.push(ip);
        });
    }
    res.writeHead(404, {
        'Content-Type': 'text/html'
    });
    res.end(not_found);
});

function cleanup() {
    server.close();
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);

if (fs.statSync(socket_file)) {
    fs.unlinkSync(socket_file);
}
server.listen(socket_file, function () {
    fs.chmod(socket_file, parseInt('777', 8));
});
// server.listen(10001);
