var fs = require('fs');
var assembler = require('./assembler');

var filename = process.argv[2];

assembler.assemble(fs.readFileSync(filename).toString(), function(binary, error) {
  if (!error) {
    console.log(binary);
  }
  else {
    console.log(error.type + " at line " + error.lineNumber + ": " + error.message);
  }
});
