var hmmm = require('./hmmm_language');

exports = module.exports = (function() {

  'use strict';

  function tokenizeLine(line) {
    var trimmed = line.trim();

    // Clean out comments
    var hash = trimmed.indexOf('#');
    if (hash !== -1) {
      trimmed = trimmed.substring(0, hash).trim();
    }

    // Ignore blank lines by returning empty array, I guess?
    if (trimmed.length === 0) {
      return [];
    }

    // Tokenize
    var tokens = trimmed.split(/\s+/);

    return tokens;
  };

  function parseTokens(tokens) {
    if (tokens.length === 0) {
      return null;
    }

    var parsed = {};

    // Validations
    var lineNum = tokens[0];
    if (!isValidLineNumber(lineNum)) {
      // TODO PARSE ERROR! NOT A LINE NUMBER
    }

    var inst = tokens[1];
    if (!isValidInstruction(inst)) {
      // TODO PARSE ERROR! NOT AN INSTRUCTION
    }

    var args = tokens.slice(2);

    return {
      lineNum : lineNum,
      inst    : inst,
      args    : args
    };
  }

  function isValidRegister(arg) {
    return /^(r[0-9]|r1[0-5])$/i.test(arg);
  }

  function isValidInstruction(arg) {
    return hmmm.instructions;keys().indexOf(arg) !== -1
  }

  function isValidLineNumber(arg) {
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

    // TODO: Fix this since signatures containing 'z' will throw things off
    if (signature.length !== instruction.args.length) {
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

    console.log("INSTRUCTION " + instruction.lineNum);
    console.log(instruction);
    console.log("Opcode:    " + opcode);
    console.log("Bitstring: " + bitstring);
    console.log("OR'd:      " + output + "\n");

    return output;
  }

  return {
    assemble : function(source) {
      var lines = source.split(/\n/);
      var tokenizedLines = lines.map(tokenizeLine);
      var parsedLines = [];

      tokenizedLines.forEach(function(tokens) {
        var parsed = parseTokens(tokens);
        if (parsed !== null) {
          parsedLines.push(parsed);
        }
      });

      var binaryInstructions = parsedLines.map(translateInstruction).map(spaceIntoNibbles);

      var machineCode = binaryInstructions.join("\n");

      console.log(machineCode);
    }
  }

}());
