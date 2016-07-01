var fs = require('fs');
var check = require('syntax-error');

var file = __dirname + '/app/script.js';
var src = fs.readFileSync(file);

var err = check(src, file);
if (err) {
    console.error('ERROR DETECTED' + Array(62).join('!'));
    console.error(err);
    console.error(Array(76).join('-'));
}
