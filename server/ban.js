"use strict";
var http = require('http');
var fs = require('fs');
var banlist_filename = __dirname + '/../client/banlist.conf';
var socket_filename = '/tmp/socex-ban.sock';
// var banlist = [];
var banlist_file = fs.openSync(banlist_filename, 'w');
var not_found = fs.readFileSync(__dirname + '/../client/pages/404.html');
var spawn = require('child_process').spawn;

var server = http.createServer(function (req, res) {
    var ip = req.headers.ip;
    // if (banlist.indexOf(ip) < 0) {
        fs.write(banlist_file, `deny ${ip};\n`, function (err) {
            if (err) {
                console.log(err);
            }
            else {
                // banlist.push(ip);
                fs.fsync(banlist_file, function (err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log('BAN ' + ip);
                        spawn('bash', [__dirname + '/nginx/restart.sh']);
                    }
                });
            }
        });
    // }
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
fs.access(banlist_filename, fs.F_OK, function (err) {
    if (err) {
        console.error(err);
    } else {
        // banlist = fs.readFileSync(banlist_filename);
        // banlist = banlist.toString('utf8').split('\n').map(d => d.trim().slice(5).slice(-1));
    }

    fs.access(socket_filename, fs.F_OK, function (err) {
        if (!err) {
            fs.unlinkSync(socket_filename);
            console.warn('Socket exists');
        }
        server.listen(socket_filename, function () {
            fs.chmod(socket_filename, parseInt('777', 8));
        });
    });
});
// server.listen(10001);
