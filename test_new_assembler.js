var HmmmAssembler = require('./new_assembler');
var a = new HmmmAssembler();
var allTokens = a.assemble("0 read r1 # Read user input\n1 nop\n\n2  *() r34l  addn r1 -50");

console.log(allTokens);

allTokens.map(function(l) {
  console.log(l.tokens);
})