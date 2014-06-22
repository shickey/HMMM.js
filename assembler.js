var fs = require('fs');
var tr = require('through');
var split = require('split');

var filename = process.argv[2];

var fileStream = fs.createReadStream(filename)

fileStream.pipe(split()).pipe(tr(function(line) {
  var that = this;
  assembler.parseLine(line, function(binary, error) {
    if (!error) {
      that.queue(binary);
    }
    else {
      that.queue(error);
    }
    that.queue("\n");
  });

})).pipe(process.stdout)



var assembler = (function() {

  function tokenizeLine(line) {
    var trimmed = line.trim();

    // Clean out comments
    var hash = trimmed.indexOf('#');
    if (hash !== -1) {
      trimmed = trimmed.substring(0, hash).trim();
    }

    // Ignore blank lines and return immediately, I guess?
    if (trimmed.length === 0) {
      return;
    }

    // Tokenize
    var tokens = trimmed.split(/\s+/);

    return tokens;
  };

  return {
    parseLine : function(line, callback) {
      var tokens = tokenizeLine(line);
      if (tokens !== undefined) {
        callback(tokens.toString());
      }
    }
  }

}());
