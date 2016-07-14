var http = require('http');

var server = http.createServer(function (req, res) {
    if (req.headers.authorization && req.url.indexOf('/logout') < 0) {
        res.end(JSON.stringify(req.headers));
    }
    else {
        res.writeHead(401, {
            'WWW-Authenticate': 'Basic'
        });
        res.end();
    }
});

server.listen(9000);
