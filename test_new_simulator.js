var HmmmSimulator = require('./new_simulator')

var inHandler = function() {
  return 5;
}

var outHandler = function(data) {
  console.log(data);
}

var s = new HmmmSimulator(inHandler, outHandler, outHandler);
s.loadBinary("0000 0001 0000 0001\n0000 0001 0000 0010\n0101 0001 0000 0101\n0000 0001 0000 0010\n0000 0000 0000 0000");
s.run();