var s  = require('./simulator');
var fs = require('fs');

var filename = process.argv[2];

var binary = fs.readFileSync(filename).toString();

s.loadProgram(binary);
s.run();
