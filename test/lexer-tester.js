var hmmm = require('../hmmm');

if (process && process.argv) {
  
  var fs = require('fs');
  var source = fs.readFileSync(process.argv[2]).toString();
  
  var tokens = hmmm.assembler.lex(source);
  
  for (var i = 0; i < tokens.length; ++i) {
    var t = tokens[i];
    console.log(t.type);
    console.log(t.range.start);
    console.log(t.range.end);
    console.log(t.val);
    console.log("\n--------------\n");
  }
  
}