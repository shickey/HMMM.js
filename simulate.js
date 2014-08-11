var HmmmSimulator = require('./simulator');
var fs = require('fs');

var filename = process.argv[2];

var binary = fs.readFileSync(filename).toString();

var s = new HmmmSimulator(binary);

s.on('register', function(register, value) {
  console.log("Register " + register + " updated to " + value);
});

s.on('ram', function(address, value) {
  console.log("Value " + value + " stored at memory address " + address);
});

s.on('halt', function() {
  console.log("HALT");
})

s.run();
