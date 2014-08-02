var HmmmSimulator = require('./simulator');
var fs = require('fs');

var filename = process.argv[2];

var binary = fs.readFileSync(filename).toString();

var s = new HmmmSimulator(binary);

s.run();
