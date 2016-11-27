var hmmm = require('../hmmm');

if (process && process.argv) {
  
  var fs = require('fs');
  var source = fs.readFileSync(process.argv[2]).toString();
  
  var tokens = hmmm.assembler.lex(source);
  var assembled = hmmm.assembler.parse(tokens);
  
  if (assembled.errors) {
    assembled.errors.forEach(function(error) {
      console.log(hmmm.assembler.prettyStringForError(error, source));
    })
  }
  else {
    console.log(assembled.binary);
  }
  
}