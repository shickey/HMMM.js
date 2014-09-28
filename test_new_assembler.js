var HmmmAssembler = require('./new_assembler');
var a = new HmmmAssembler();
// var allTokens = a.assemble("0 read r1 # Read user input\n1 nop\n\n2  addn *() r34l  addn r1 -50");
var output = a.assemble(" 0  read r1\n1 write r1\n2 read  r2 # read r2\n3 jeqz r2 7\n  4 div r3 r1 r2\n5 write r3\n6 halt    # end\n7      setn r3  0\n8 write r3\n9 halt");

console.log(output);

// allTokens.map(function(l) {
//   console.log(l.tokens);
// })