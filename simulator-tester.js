var hmmm = require('./hmmm');

if (process && process.argv) {
  
  var fs = require('fs');
  var source = fs.readFileSync(process.argv[2]).toString();
  
  var tokens = hmmm.assembler.lex(source);
  var assembled = hmmm.assembler.parse(tokens);
  
  
  var simulator = hmmm.simulator.createSimulator(function() {
    // Input
    return "5";
  }, function(message) {
    // Output
    console.log(message);
  }, function(message) {
    // Error
    console.log(message);
  });
  
  simulator.loadBinary(assembled.binary);
  
  simulator.run(null, function() {
    console.log(simulator.registers);
  });
  
}