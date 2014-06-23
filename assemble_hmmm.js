var fs = require('fs');
var tr = require('through');
var split = require('split');
var assembler = require('./assembler');

var filename = process.argv[2];

var fileStream = fs.createReadStream(filename)

// fileStream.pipe(split()).pipe(tr(function(line) {
//   var that = this;
//   assembler.parseLine(line, function(binary, error) {
//     if (!error) {
//       that.queue(binary);
//     }
//     else {
//       that.queue(error);
//     }
//     that.queue("\n");
//   });
//
// })).pipe(process.stdout)

assembler.assemble(fs.readFileSync(filename).toString());
