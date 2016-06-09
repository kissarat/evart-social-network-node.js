"use strict";
var nodeStatic = require('node-static');
var fs = require('fs');

var staticServer = new nodeStatic.Server('./static');

var stream = null;
var buffer = [];
var k = 0;
var stream_regex = /^\/stream\/([\da-f]{24})/;

require('http').createServer(function (req, res) {
    var filename = `video/${k}.webm`;
    if ('POST' == req.method || 'PUT' == req.method) {
        if (!stream) {
            stream = fs.createWriteStream('static/' + filename, {autoClose: false});
            buffer = [];
        }
        req.pipe(stream, {end: false});
        var close = 'PUT' == req.method;
        req.on('data', function (chunk) {
            iterate(c => c.write(chunk));
            buffer.push(chunk);
        });
        req.on('end', function () {
            res.end();
            if (close) {
                iterate(c => c.end());
                clients = {};
                stream.end();
                stream = null;
                k++;
            }
        })
    }
    else if (stream_regex.test(req.url)) {
        clients[++i] = res;
        res.writeHead(200, {
            'Content-Type': 'video/webm'
        });
        buffer.forEach(function (chunk) {
            res.write(chunk);
        })
    }
    else {
        req.addListener('end', function () {
            staticServer.serve(req, res);
        }).resume();
    }

}).listen(8080);

var i = 0;

var clients = {};

function iterate(cb) {
    for (var j in clients) {
        cb(clients[j]);
    }
}
