"use strict";

var stdin = process.openStdin();

var data = [];

stdin.on('data', function (chunk) {
    data.push(chunk);
});

stdin.on('end', function () {
    data = data.join('');
    var ips = [];
    data.split('\n').forEach(function (line) {
        var ip = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/.exec(line);
        if (ip) {
            ip = ip[1].split('.').map(d => parseInt(d));
            ips.push(ip);
        }
    });

    ips = ips.sort(function (a, b) {
        for(var i = 0; i < 4; i++) {
            if (a[i] != b[i]) {
                return a[i] - b[i];
            }
        }
        return 0;
    });

    ips = new Set(ips.map(d => 'deny ' + d.join('.') + ';'));
    console.log(Array.from(ips).join('\n'));
});
