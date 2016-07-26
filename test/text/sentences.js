const fs = require('fs');

var input = fs.readFileSync('input.txt').toString();
var output = [];
input.split(/\.\.\.|\.|\?|!/g).map(function (sentence) {
  sentence = sentence.replace(/\s+/g, ' ').trim();
  if (sentence && sentence.length < 120 && /^[А-Я]/.test(sentence) && !/[\{}]/.test(sentence)) {
    sentence = sentence
      .replace(/\*/g, '')
      .replace(/\-\-/g, '–');
    output.push(sentence);
  }
});
fs.writeFileSync('sentences.txt', output.sort().join('\n'));
