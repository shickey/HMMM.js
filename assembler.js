var hmmm = require('./hmmm_language');
var StringScanner = require('StringScanner');

exports = module.exports = (function() {

  'use strict';
  
  var errors = Object.freeze({
    ASSEMBLER   : "ASSEMBLER ERROR",
    SYNTAX      : "SYNTAX ERROR",
    ARGUMENT    : "ARGUMENT ERROR",
    REGISTER    : "REGISTER ERROR",
    INST_NUM    : "INSTRUCTION NUMBER ERROR",
    INSTRUCTION : "INSTRUCTION ERROR"
  });
  
  // Error Constructors
  function AssemblerError(lineNumber, message) {
    this.type = errors.ASSEMBLER;
    this.lineNumber = lineNumber;
    this.message = message || "";
  }
  
  function SyntaxError(lineNumber, message) {
    this.type = errors.SYNTAX;
    this.lineNumber = lineNumber;
    this.message = message || "";
  }
  
  function ArgumentError(lineNumber, message) {
    this.type = errors.ARGUMENT;
    this.lineNumber = lineNumber;
    this.message = message || "";
  }
  
  function RegisterError(lineNumber, message) {
    this.type = errors.REGISTER;
    this.lineNumber = lineNumber;
    this.message = message || "";
  }
  
  function InstructionNumberError(lineNumber, message) {
    this.type = errors.INST_NUM;
    this.lineNumber = lineNumber;
    this.message = message || "";
  }
  
  function InstructionError(lineNumber, message) {
    this.type = errors.INSTRUCTION;
    this.lineNumber = lineNumber;
    this.message = message || "";
  }
  
  function tokenizeLine(line, lineNumber) {
    var tokenizedLine = {
      lineNumber : lineNumber,
      tokens     : []
    };
    
    var ss = new StringScanner(line);

    // Scan for leading whitespace
    ss.scan(/\s*/);
    if (ss.eos() || ss.peek(1) === "#") {
      // If the line was blank or a comment, just return an empty array of tokens
      return tokenizedLine;
    }

    // Grab the line number
    var lineNum = ss.scan(/\d+/);
    if (lineNum === null) {
      throw new InstructionNumberError(lineNumber, "Missing instruction number");
    }
    tokenizedLine.tokens.push(lineNum);

    if (ss.scan(/\s+/) === null) {
      // Try to advance through whitespace
      // TODO Throw parse error
    }

    var inst = ss.scan(/\w+/);
    if (inst === null) {
      // TODO Throw missing instruction error
    }
    tokenizedLine.tokens.push(inst);

    if (ss.scan(/\s+/) === null) {
      // Try to advance through whitespace
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
      tokenizedLine.tokens.push(regOrNumToken);
      ss.scan(/[,\s]+/);
    }

    return tokenizedLine;
  }

  function parseTokens(tokenizedLine) {
    var tokens = tokenizedLine.tokens;
    if (tokens.length === 0) {
      return null;
    }

    // Validations
    var instNum = tokens[0];
    if (!isValidInstructionNumber(instNum)) {
      // TODO PARSE ERROR! NOT A LINE NUMBER
    }
    
    var inst = tokens[1];
    if (!isValidInstruction(inst)) {
      throw new InstructionError(tokenizedLine.lineNumber, "Invalid instruction at line 1");
    }

    var args = tokens.slice(2);

    return {
      lineNumber : tokenizedLine.lineNumber,
      instNum    : +(instNum),
      inst       : inst,
      args       : args
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
      throw new ArgumentError(instruction.lineNumber, "Wrong number of arguments. Expected " + numExpectedArgs + " and found " + instruction.args.length);
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
  
    assemble: function(source, callback) {
      var lines = source.split(/\n/);
      
      var instructions = [];
      var expectedInstNum = 0;
      
      // Use a 1-indexed offest for the line number (which matches text-editor conventions)
      for (var lineNumber = 1; lineNumber <= lines.length; ++lineNumber) {
        try {
          var line = lines[lineNumber - 1];
          var tokenizedLine = tokenizeLine(line, lineNumber);
          var parsed = parseTokens(tokenizedLine);
          if (parsed === null) { // Line was empty or comment-only
            continue;
          }
          else {
            // Check to make sure the instructions are in order
            if (parsed.instNum !== expectedInstNum) {
              throw new InstructionNumberError(lineNumber, "Wrong instruction number. Expected " + expectedInstNum + ", found " + parsed.instNum);
            }
            expectedInstNum += 1;
          }
          var instruction = translateInstruction(parsed);
          instructions.push(instruction);
        }
        catch(e) {
          if (callback) {
            callback(null, e);
          }
          return;
        }
      }
      var machineCode = instructions.map(spaceIntoNibbles).join("\n");
      machineCode += "\n"; // Newline at end of file
      
      callback(machineCode);
    }
    
  }

}());
