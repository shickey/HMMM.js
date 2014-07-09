var hmmm = require('./hmmm_language');
var StringScanner = require('StringScanner');

exports = module.exports = (function() {

  'use strict';
  
  var instNumber  = 0;
  var lineNumber  = 0;
  var error = null;
  
  var errors = Object.freeze({
    PARSE    : 'PARSE ERROR',
    INST_NUM : 'BAD INSTRUCTION NUMBER',
    INTERNAL : 'INTERNAL ASSEMBLER ERROR'
  });
  
  function constructError(type, message) {
    var errorMessage = message || "General assembler error";
    error = {
      type    : type,
      line    : lineNumber,
      message : type + ": " + errorMessage + ' at line ' + lineNumber
    };
    return;
  };

  function tokenizeLine(line) {
    var tokens = [];
    var ss = new StringScanner(line);

    // Scan for leading whitespace
    ss.scan(/\s*/);
    if (ss.eos() || ss.peek(1) === "#") {
      // If the line was blank or a comment, just return an empty array of tokens
      return tokens;
    }

    // Grab the line number
    var lineNum = ss.scan(/\d+/);
    if (lineNum === null) {
      constructError(errors.INST_NUM, 0, "Missing instruction number");
      return;
    }
    tokens.push(lineNum);

    if (ss.scan(/\s+/) === null) {
      // Try to advance through whitespace, if there is none
      // TODO Throw parse error
    }

    var inst = ss.scan(/\w+/);
    if (inst === null) {
      // TODO Throw missing instruction error
    }
    tokens.push(inst);

    if (ss.scan(/\s+/) === null) {
      // Try to advance through whitespace, if there is none
      // TODO Throw parse error
    }

    while (!ss.eos()) {
      if (ss.peek(1) === "#") {
        ss.terminate();
        break;
      }

      var regOrNumToken = ss.scan(/[rR]1[0-5]|[rR][0-9]|-?[0-9xXa-fA-F]+/);
      if (regOrNumToken === null) {
        // TODO Parse error
      }
      tokens.push(regOrNumToken);
      ss.scan(/[,\s]+/);
    }

    console.log(tokens);

    return tokens;
  }

  function parseTokens(tokens) {
    if (tokens.length === 0) {
      return null;
    }

    var parsed = {};

    // Validations
    var instNum = tokens[0];
    if (!isValidInstructionNumber(instNum)) {
      // TODO PARSE ERROR! NOT A LINE NUMBER
    }
    
    if (+(instNum) !== instNumber) {
      constructError(errors.INST_NUM, "Wrong instruction number");
      return;
    }

    var inst = tokens[1];
    if (!isValidInstruction(inst)) {
      // TODO PARSE ERROR! NOT AN INSTRUCTION
    }

    var args = tokens.slice(2);

    return {
      lineNum : instNum,
      inst    : inst,
      args    : args
    };
  }

  function isValidRegister(arg) {
    return /^(r[0-9]|r1[0-5])$/i.test(arg);
  }

  function isValidInstruction(arg) {
    return Object.keys(hmmm.instructions).indexOf(arg) !== -1
  }

  function isValidInstructionNumber(arg) {
    return /^(0|[1-9]\d*)$/.test(arg);
  }

  function isValidSignedArgument(arg) {
    var valid_decimal =  /^-?[0-9]+$/.test(arg) && +arg >= -128 && +arg <= 127;
    // The unary + doesn't play nicely with negative hex values, so we use parseInt here
    var valid_hex     =  /^-?0[xX][0-9a-fA-F]+$/.test(arg) && parseInt(arg) >= -128 && parseInt(arg) <= 127;
    return valid_decimal || valid_hex;
  }

  function isValidUnsignedArgument(arg) {
    var valid_decimal =  /^[0-9]+$/.test(arg) && +arg >= 0 && +arg <= 255;
    var valid_hex     =  /^0[xX][0-9a-fA-F]+$/.test(arg) && +arg >= 0 && +arg <= 255;
    return valid_decimal || valid_hex;
  }

  function padZeroesLeft(string, width) {
    var pad = "";
    for (var i = 0; i < width; ++i) {
      pad += "0";
    }
    return pad.substring(0, pad.length - string.length) + string;
  }

  function binaryForRegister(register) {
    var bin_string = (+(register.slice(1))).toString(2);
    return padZeroesLeft(bin_string, 4);
  }

  function binaryForInteger(integer, width) {
    if (width === undefined) {
      width = 8;
    }

    if (integer > Math.pow(2,width)) {
      // TODO Overflow!
    }

    if (integer < 0) {
      // Two's Complement
      var positive = padZeroesLeft(Math.abs(integer).toString(2), width);
      var flipped = flipBitstring(positive);
      var backToNum = parseInt(flipped, 2);
      return padZeroesLeft((backToNum + 1).toString(2), width);
    }

    return padZeroesLeft(parseInt(integer).toString(2), width);
  }

  function flipBitstring(bitstring) {
    var flipped = "";
    for (var i = 0; i < bitstring.length; ++i) {
      if (bitstring[i] == "0") {
        flipped += "1"
      }
      else if (bitstring[i] == "1") {
        flipped += "0"
      }
      else {
        return null;
      }
    }
    return flipped;
  }

  function spaceIntoNibbles(bitstring) {
    var spaced = "";
    for (var i = 0; i < bitstring.length; ++i) {
      if (i % 4 === 0 && i !== 0) {
        spaced += " ";
      }
      spaced += bitstring[i];
    }
    return spaced;
  }

  function translateInstruction(instruction) {
    var inst = hmmm.instructions[instruction.inst];
    var signature = hmmm.signatures[inst];

    // Since some signatures contain the 'z' padding argument,
    // the expected number of args does not necessarily equal signature.length;
    var numExpectedArgs = signature.length - (signature.match(/z/) || []).length;
    if (numExpectedArgs !== instruction.args.length) {
      // TODO ERROR! Instruction has wrong number of arguments
    }

    // Start with the opcode
    var opcode = hmmm.opcodes[inst].opcode;

    // Build a bit string that we will OR with the output, handle 'data' instruction as a special case
    var bitstring = "0000";
    if (inst === "data") {
      bitstring = "";
    }

    var argIndex = 0;
    for (var signatureIndex = 0; signatureIndex < signature.length; ++signatureIndex) {
      var arg = instruction.args[argIndex];
      var type = signature[signatureIndex];

      if (type === "z") {
        bitstring += "0000";
        continue; // Don't increment the argIndex
      }

      if (type === "r") {
        if (isValidRegister(arg)) {
          bitstring += binaryForRegister(arg);
        }
        else {
          console.log("Error: Improper register");
          // TODO Handle error
        }
      }
      else if (type === "u" || type === "s") {
        bitstring += binaryForInteger(parseInt(arg), 8);
      }
      else if (type === "n") {
        bitstring += binaryForIntger(parseInt(arg), 16);
      }
      else {
        // TODO Throw compiler error
      }
      argIndex += 1;
    }

    // Pad with zeroes to make width always 16 bits
    var paddingNeeded = 16 - bitstring.length;
    for (var j = 0; j < paddingNeeded; ++j) {
      bitstring += "0";
    }

    // Bitwise OR with the opcode
    var output = (parseInt(opcode, 2) | parseInt(bitstring, 2)).toString(2);

    output = padZeroesLeft(output, 16);

    return output;
  }

  return {
    assemble : function(source, callback) {
      var lines = source.split(/\n/);
      
      instNumber = 0;
      lineNumber = 0;
      var instructions = [];
      
      for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];
        var tokens = tokenizeLine(line);
        if (error) {
          callback(null, error);
          return;
        }
        var parsed = parseTokens(tokens);
        if (error) {
          callback(null, error);
          return;
        }
        if (parsed === null) { // If the line was empty or comment-only...
          lineNumber += 1;     // Increment the line number and keep parsing...
          continue;            // But DON'T increment instruction number
        }
        var instruction = translateInstruction(parsed);
        if (error) {
          callback(null, error);
          return;
        }
        instructions.push(instruction);
        lineNumber += 1;
        instNumber += 1;
      }

      var machineCode = instructions.map(spaceIntoNibbles).join("\n");
      machineCode += "\n" // Newline at end of file
      
      callback(machineCode);
    }
  }

}());
