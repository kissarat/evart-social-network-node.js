const fs = require('fs');

var input = fs.readFileSync('sentences.txt').toString().split(/\n/);
var output = input.sort((a, b) => a.length - b.length || a.localeCompare(b));
output = output.map(a => a.replace(/"([^"]+)"/g, '«$1»'));
output = JSON.stringify(output, null, '  ');
fs.writeFileSync('sentences.json', output);
