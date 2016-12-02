/**
 * HMMM.js
 * 
 * A javascript implementation of [Harvey-Mudd Miniature Machine (HMMM)](https://www.cs.hmc.edu/~cs5grad/cs5/hmmm/documentation/documentation.html)
 *
 * 2014-2016 Sean Hickey
 * https://github.com/shickey/HMMM.js
 */
;
var hmmm = hmmm || {};
 
(function() {
  'use strict';
  
  //*********************************************
  //
  // HMMM Language
  //
  //*********************************************
  
  hmmm.lang = Object.freeze({

    // Maps all instruction aliases to their respective
    // standardized HMMM instruction name
    instructions : Object.freeze({
      "halt"   : "halt",
      "read"   : "read",
      "write"  : "write",
      "jumpr"  : "jumpr",
      "setn"   : "setn",
      "loadn"  : "loadn",
      "storen" : "storen",
      "loadr"  : "loadr",
      "storer" : "storer",
      "addn"   : "addn",
      "add"    : "add",
      "copy"   : "copy",
      "nop"    : "nop",
      "sub"    : "sub",
      "neg"    : "neg",
      "mul"    : "mul",
      "div"    : "div",
      "mod"    : "mod",
      "jumpn"  : "jumpn",
      "calln"  : "calln",
      "jeqzn"  : "jeqzn",
      "jgtzn"  : "jgtzn",
      "jltzn"  : "jltzn",
      "jnezn"  : "jnezn",
      
      // Aliases
      "mov"    : "copy",
      "jump"   : "jumpr",
      "jeqz"   : "jeqzn",
      "jnez"   : "jnezn",
      "jgtz"   : "jgtzn",
      "jltz"   : "jltzn",
      "call"   : "calln",
      "loadi"  : "loadr",
      "load"   : "loadr",
      "storei" : "storer",
      "store"  : "storer"
    }),

    // Argument signatures for each instruction
    // r : Register
    // s : Signed 8-bit Integer
    // u : Unsigned 8-bit Integer
    // z : 4-bit Padding (0000)
    signatures : Object.freeze({
      "halt"   : "",
      "read"   : "r",
      "write"  : "r",
      "jumpr"  : "r",
      "setn"   : "rs",
      "loadn"  : "ru",
      "storen" : "ru",
      "loadr"  : "rr",
      "storer" : "rr",
      "addn"   : "rs",
      "add"    : "rrr",
      "copy"   : "rr",
      "nop"    : "",
      "sub"    : "rrr",
      "neg"    : "rzr",
      "mul"    : "rrr",
      "div"    : "rrr",
      "mod"    : "rrr",
      "jumpn"  : "zu",
      "calln"  : "ru",
      "jeqzn"  : "ru",
      "jgtzn"  : "ru",
      "jltzn"  : "ru",
      "jnezn"  : "ru"
    }),
    
    opcodes : Object.freeze({
          "halt"   : Object.freeze({ opcode : "0000000000000000", mask : "1111111111111111" }),
          "read"   : Object.freeze({ opcode : "0000000000000001", mask : "1111000011111111" }),
          "write"  : Object.freeze({ opcode : "0000000000000010", mask : "1111000011111111" }),
          "jumpr"  : Object.freeze({ opcode : "0000000000000011", mask : "1111000011111111" }),
          "setn"   : Object.freeze({ opcode : "0001000000000000", mask : "1111000000000000" }),
          "loadn"  : Object.freeze({ opcode : "0010000000000000", mask : "1111000000000000" }),
          "storen" : Object.freeze({ opcode : "0011000000000000", mask : "1111000000000000" }),
          "loadr"  : Object.freeze({ opcode : "0100000000000000", mask : "1111000000001111" }),
          "storer" : Object.freeze({ opcode : "0100000000000001", mask : "1111000000001111" }),
          "addn"   : Object.freeze({ opcode : "0101000000000000", mask : "1111000000000000" }),
          "nop"    : Object.freeze({ opcode : "0110000000000000", mask : "1111111111111111" }),
          "copy"   : Object.freeze({ opcode : "0110000000000000", mask : "1111000000001111" }),
          "add"    : Object.freeze({ opcode : "0110000000000000", mask : "1111000000000000" }),
          "neg"    : Object.freeze({ opcode : "0111000000000000", mask : "1111000011110000" }),
          "sub"    : Object.freeze({ opcode : "0111000000000000", mask : "1111000000000000" }),
          "mul"    : Object.freeze({ opcode : "1000000000000000", mask : "1111000000000000" }),
          "div"    : Object.freeze({ opcode : "1001000000000000", mask : "1111000000000000" }),
          "mod"    : Object.freeze({ opcode : "1010000000000000", mask : "1111000000000000" }),
          "jumpn"  : Object.freeze({ opcode : "1011000000000000", mask : "1111111100000000" }),
          "calln"  : Object.freeze({ opcode : "1011000000000000", mask : "1111000000000000" }),
          "jeqzn"  : Object.freeze({ opcode : "1100000000000000", mask : "1111000000000000" }),
          "jnezn"  : Object.freeze({ opcode : "1101000000000000", mask : "1111000000000000" }),
          "jgtzn"  : Object.freeze({ opcode : "1110000000000000", mask : "1111000000000000" }),
          "jltzn"  : Object.freeze({ opcode : "1111000000000000", mask : "1111000000000000" })
    }),
    
    opcodePrecedence : Object.freeze([
      "halt",
      "read",
      "write",
      "jumpr",
      "setn",
      "loadn",
      "storen",
      "loadr",
      "storer",
      "addn",
      "nop",
      "copy",
      "add",
      "neg",
      "sub",
      "mul",
      "div",
      "mod",
      "jumpn",
      "calln",
      "jeqzn",
      "jnezn",
      "jgtzn",
      "jltzn"
    ])
  });


  //*********************************************
  //
  // HMMM Utils
  //
  //*********************************************

  function decodeBinaryInstruction(binInst) {
    var encoded = binInst;
    var decoded = {
      operation : null,
      args      : []
    };
    
    // Find the correct operation by iterating over the
    // list of instructions in order of precedence
    hmmm.lang.opcodePrecedence.some(function(operation){
      var opcode = parseInt(hmmm.lang.opcodes[operation].opcode, 2);
      var mask   = parseInt(hmmm.lang.opcodes[operation].mask,   2);
      if ((encoded & mask) === opcode) {
        // We found the right operation
        decoded.operation = operation;
        return true;
      }
    });
    
    if (!decoded.operation) {
      // We couldn't decode the operation
      return undefined;
    }
    
    // Parse Arguments
    var signature = hmmm.lang.signatures[decoded.operation];
    encoded = encoded << 4;
    for (var i = 0; i < signature.length; ++i) {
      var type = signature.charAt(i);
      if (type === "r") {
        var reg = (encoded & 0xf000) >> 12;
        decoded.args.push("r" + reg);
        encoded = encoded << 4;
      }
      else if (type === "s") {
        var num = (encoded & 0xff00) >> 8;
        if ((num & 0x80) !== 0) {
          num -= 256; // Account for sign
        }
        decoded.args.push(num);
        encoded = encoded << 8;
      }
      else if (type === "u") {
        var num = (encoded & 0xff00) >> 8;
        decoded.args.push(num);
        encoded = encoded << 8;
      }
      else if (type === "z") {
        encoded = encoded << 4;
      }
      else if (type === "n") {
        decoded.args.push(encoded);
        encoded = encoded << 16;
      }
      else {
        // TODO: Internal inconsistency error
        return undefined;
      }
    }
    return decoded;
  }
    
  function instructionFromBinary(binInst) {
    var decoded = decodeBinaryInstruction(binInst);
    if (!decoded) {
      return;
    }
    var instString = decoded.operation;
    for (var i = 0; i < decoded.args.length; ++i) {
      var arg = decoded.args[i];
      instString = instString + " " + arg;
    }
    return instString;
  }

  function binaryForInteger(integer, width) {
    if (width === undefined) {
      width = 8;
    }

    // TODO: This should probably check for negative underflow as well?
    if (integer > Math.pow(2,width)) {
      // TODO: Overflow!
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
  
  function padZeroesLeft(string, width) {
    var pad = "";
    for (var i = 0; i < width - string.length; ++i) {
      pad += "0";
    }
    return pad + string;
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

  function spaceIntoBytes(bitstring) {
    var spaced = "";
    for (var i = 0; i < bitstring.length; ++i) {
      if (i % 2 === 0 && i !== 0) {
        spaced += " ";
      }
      spaced += bitstring[i];
    }
    return spaced;
  }

  hmmm.util = {
    instructionFromBinary: instructionFromBinary,
    binaryForInteger: binaryForInteger,
    padZeroesLeft: padZeroesLeft,
    flipBitstring: flipBitstring,
    spaceIntoNibbles: spaceIntoNibbles,
    spaceIntoBytes: spaceIntoBytes
  };





  //*********************************************
  //
  // The HMMM Lexer
  //
  //*********************************************
  
  
  //-----------------------
  // Position Data Structs
  //-----------------------
  
  function createPoint(row, column) {
    return {
      row: row,
      column: column
    };
  };

  function createRange(startRangeOrStartRow, endRangeOrStartColumn, endRow, endColumn) {
    if (arguments.length === 2) {
      return {
        start: startRangeOrStartRow,
        end: endRangeOrStartColumn
      };
    };
    return {
      start: createPoint(startRangeOrStartRow, endRangeOrStartColumn),
      end: createPoint(endRow, endColumn)
    };
  };
  
  
  //-------------------
  // Tokens
  //-------------------

  var tokenTypes = Object.freeze({
    INSTRUCTION : "INSTRUCTION",
    REGISTER    : "REGISTER",
    CONSTANT    : "CONSTANT",
    COMMENT     : "COMMENT",
    NEWLINE     : "NEWLINE",
    UNKNOWN     : "UNKNOWN"
  });

  function printableStringForType(tokenType) {
    if (tokenType === tokenTypes.INSTRUCTION) {
      return "instruction";
    }
    else if (tokenType === tokenTypes.REGISTER) {
      return "register";
    }
    else if (tokenType === tokenTypes.CONSTANT) {
      return "integer";
    }
    else if (tokenType === tokenTypes.COMMENT) {
      return "comment";
    }
    else if (tokenType === tokenTypes.NEWLINE) {
      return "newline";
    }
    else if (tokenType === tokenTypes.UNKNOWN) {
      return "something odd...(looks like a syntax error)";
    }
  }

  function createInstructionToken(range, inst) {
    return {
      type: tokenTypes.INSTRUCTION,
      range: range,
      val: inst
    };
  };

  function createRegisterToken(range, reg) {
    return {
      type: tokenTypes.REGISTER,
      range: range,
      val: reg
    };
  };

  function createConstantToken(range, constant) {
    return {
      type: tokenTypes.CONSTANT,
      range: range,
      val: constant
    };
  };

  function createCommentToken(range, comment) {
    return {
      type: tokenTypes.COMMENT,
      range: range,
      val: comment
    };
  };

  function createNewlineToken(range) {
    return {
      type: tokenTypes.NEWLINE,
      range: range
    };
  };

  function createUnknownToken(range, value) {
    return {
      type: tokenTypes.UNKNOWN,
      range: range,
      val: value
    };
  };


  //-------------------
  // Token Validators
  //-------------------
  
  function isWhitespace(character) {
    return character === ' ' || character === '\t';
  }
  
  function isNewline(character) {
    return character === '\n';
  }
  
  function isNumericConstant(string) {
    return /^-?[0-9]+$/.test(string) || /^-?0[xX][0-9a-fA-F]+$/.test(string);
  }
  
  function isRegister(string) {
    return /^r[0-9]+$/i.test(string);
  }
  
  function isInstruction(string) {
    return string in hmmm.lang.instructions;
  }
  
  function isTokenBreak(character) {
    return (character === undefined || isWhitespace(character) || isNewline(character) || character === ",");
  }
  
  
  //-------------------
  // The Actual Lexer
  //-------------------
  
  function lex(source) {
    
    var lineNum = 1;
    var colNum = 1;
    var peek = '';
    
    // Inner functions for scanning
    var currPos = 0;
    function getNextChar() {
      if (currPos >= source.length) {
        return undefined;
      }
      var nextChar = source[currPos];
      currPos += 1;
      colNum += 1;
      return nextChar;
    }
    
    function lookAhead(numChars) {
      if (currPos >= source.length) {
        return undefined;
      }
      return source.slice(currPos, currPos + numChars);
    }
    
    function scanToTokenBreak() {
      var chars = peek;
      var next = lookAhead(1);
      while (next && !isTokenBreak(next)) {
        peek = getNextChar();
        chars += peek;
        next = lookAhead(1);
      }
      return chars;
    }
    
    function scanToLineBreak() {
      var chars = peek;
      var next = lookAhead(1);
      while (next && !isNewline(next)) {
        peek = getNextChar();
        chars += peek;
        next = lookAhead(1);
      }
      return chars;
    }
    
    var tokens = [];
    
    while (peek !== undefined) {
      // Scan over whitespace and find newlines
      while (true) {
        peek = getNextChar();
        if (isWhitespace(peek) || (peek === ",")) {
          continue;
        }
        else if (isNewline(peek)) {
          var range = createRange(lineNum, colNum, lineNum, colNum);
          tokens.push(createNewlineToken(range));
          lineNum += 1;
          colNum = 1;
        }
        else {
          break;
        }
      }
      
      // Comments
      if (peek === '#') {
        var start = createPoint(lineNum, colNum);
        var comment = scanToLineBreak();
        var end = createPoint(lineNum, colNum);
        var range = createRange(start, end);
        
        tokens.push(createCommentToken(range, comment));
        
        continue;
      }
      
      var startOfToken = colNum;
      var currToken = scanToTokenBreak();
      
      if (currToken === undefined) {
        continue;
      }
      
      var start = createPoint(lineNum, colNum - currToken.toString().length);
      var end   = createPoint(lineNum, colNum);
      var range = createRange(start, end);
      
      if (isNumericConstant(currToken)) {
        var num = (+currToken);
        tokens.push(createConstantToken(range, num));
      }
      else if (isRegister(currToken)) {
        tokens.push(createRegisterToken(range, currToken));
      }
      else if (isInstruction(currToken)) {
        tokens.push(createInstructionToken(range, currToken));
      }
      else {
        tokens.push(createUnknownToken(range, currToken));
      }

    }
    
    return tokens;
    
  }
  
  

  //*********************************************
  //
  // The HMMM Parser
  //
  //*********************************************
  
  
  //----------------------
  // Argument Validators
  //----------------------
  
  function isValidRegisterArgument(arg) {
    return /^(r[0-9]|r1[0-5])$/i.test(arg);
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
  
  
  //----------------------
  // Binary Stuff
  //----------------------

  function binaryForRegister(register) {
    var bin_string = (+(register.slice(1))).toString(2);
    return padZeroesLeft(bin_string, 4);
  }
  
  function binaryForTokens(instToken, argTokens) {
    // At this point, we assume that the tokens are formed correctly and in the
    // right order, so we forgo error checking in this function
    
    // Get standarized instruction name (i.e., resolve aliases)
    var inst = hmmm.lang.instructions[instToken.val];
    var signature = hmmm.lang.signatures[inst];
    var unpaddedSignature = signature.replace(/z/, ""); // Remove z's (since they only represent padding)
    var expectedNumArgs = unpaddedSignature.length;
    
    // Start with the opcode
    var opcode = hmmm.lang.opcodes[inst].opcode;
    
    // Build the argument bitstring which will be OR'd with the opcode to produce final binary
    var bitstring = "0000"
    
    var argIndex = 0; // Keep track of argument index separately to handle signatures with z's (i.e., padding)
    for (var i = 0; i < signature.length; ++i) {
      var argToken = argTokens[argIndex];
      var argType = signature[i];
      
      if (argType === "z") {
        // Add padding, but don't increment argIndex
        bitstring += "0000";
        continue;
      }
      else if (argType === "r") {
        bitstring += binaryForRegister(argToken.val);
      }
      else if (argType === "u" || argType === "s") {
        bitstring += binaryForInteger(argToken.val, 8);
      }
      else {
        // TODO: Internal error
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
  
  
  //----------------------
  // Error Handling
  //----------------------
  
  function createParseError(range, message) {
    return {
      range: range,
      message: message
    };
  };
  
  function prettyStringForError(error, source) {
    var prettyString = "ERROR [" + error.range.start.row + ":" + error.range.start.column + "]: " + error.message;
    if (source !== undefined) {
      var lines = source.split("\n");
      prettyString += "\n" + lines[error.range.start.row - 1] + "\n";
      prettyString += "\x1B[31m"; // Draw the error in red
      for (var k = 0; k < error.range.start.column - 1; ++k) {
        prettyString += " ";
      }
      prettyString += "^";
      for (var k = 0; k < error.range.end.column - error.range.start.column - 1; ++k) {
        prettyString += "~";
      }
      prettyString += "\x1B[0m";
    }
    return prettyString;
  }
  
  //----------------------
  // The Actual Parser
  //----------------------
  
  var parserStates = Object.freeze({ // Indicates what the parser is "looking for"
    INST_NUM     : "INST_NUM",
    INST         : "INST",
    REGISTER     : "REGISTER",
    UNSIGNED_INT : "UNSIGNED_INT",
    SIGNED_INT   : "SIGNED_INT",
    NEWLINE      : "NEWLINE",
    ERROR        : "ERROR"
  });
  
  function parse(tokens) {
    
    var state = parserStates.INST_NUM;
    var nextInstNum = 0;
    var nextArgTypes = [];
    var currentInstToken = undefined;
    var currentArgTokens = [];
    
    var token = undefined;
    
    var bin = "";
    var errors = [];
    var generatedError = false;
    
    function throwParseError(message) {
      
      errors.push(createParseError(token.range, message));
      
      generatedError = true;
      state = parserStates.ERROR;
    }
    
    function transitionStateToNextArgType() {
      if (nextArgTypes.length === 0) {
        state = parserStates.NEWLINE;
        bin += spaceIntoNibbles(binaryForTokens(currentInstToken, currentArgTokens)) + "\n";
      }
      else {
        state = nextArgTypes.shift();
      }
    }
    
    for (var i = 0; i < tokens.length; ++i) {
      token = tokens[i];
      
      // Checking for the next instruction number
      if (state === parserStates.INST_NUM) {
        
        if (token.type === tokenTypes.COMMENT || 
            token.type === tokenTypes.NEWLINE) { continue; }
        
        // Reset state
        currentInstToken = undefined;
        currentArgTokens = [];
        
        if (token.type === tokenTypes.CONSTANT) {
          if (!(token.val === nextInstNum)) {
            throwParseError("Expected instruction number " + nextInstNum + " but found " + printableStringForType(token.val));
            
            // Force the instruction number to be one more than the one found
            // in order to try to suppress the same error on future lines
            nextInstNum = token.val + 1;
          }
          else {
            nextInstNum += 1;
            state = parserStates.INST;
          }
        }
        else {
          throwParseError("Expected an instruction number but found " + printableStringForType(token.type));
        }
        
      }
      
      // Checking for an instruction
      else if (state === parserStates.INST) {
        
        if (token.type === tokenTypes.INSTRUCTION) {
          
          // Figure out what the next parser states should be and keep them in a queue
          var currentInstToken = token;
          
          var argSignature = hmmm.lang.signatures[hmmm.lang.instructions[token.val]]; // Resolve aliases before grabbing signature
          var argCodes = argSignature.split("");
          nextArgTypes = []
          for (var j = 0; j < argCodes.length; ++j) {
            var argCode = argCodes[j];
            if (argCode === "r") {
              nextArgTypes.push(parserStates.REGISTER);
            }
            else if (argCode === "u") {
              nextArgTypes.push(parserStates.UNSIGNED_INT);
            }
            else if (argCode === "s") {
              nextArgTypes.push(parserStates.SIGNED_INT);
            }
          }
          
          transitionStateToNextArgType();
          
        }
        else {
          throwParseError("Expected an instruction but found " + printableStringForType(token.type));
        }
      }
      
      // Checking for a register argument
      else if (state === parserStates.REGISTER) {
        if (token.type === tokenTypes.REGISTER) {
          
          currentArgTokens.push(token);
          transitionStateToNextArgType();
          
        }
        else {
          throwParseError("Expected a register argument but found " + printableStringForType(token.type));
        }
      }
      
      // Checking for an unsigned integer argument
      else if (state === parserStates.UNSIGNED_INT) {
        if (token.type === tokenTypes.CONSTANT) {
          
          currentArgTokens.push(token);
          transitionStateToNextArgType();
          
        }
        else {
          throwParseError("Expected an unsigned integer argument but found " + printableStringForType(token.type));
        }
      }
      
      // Checking for a signed integer argument
      else if (state === parserStates.SIGNED_INT) {
        if (token.type === tokenTypes.CONSTANT) {
          
          currentArgTokens.push(token);
          transitionStateToNextArgType();
          
        }
        else {
          throwParseError("Expected a signed integer argument but found " + printableStringForType(token.type));
        }
      }
      
      // Checking for a newline
      else if (state === parserStates.NEWLINE) {
        
        if (token.type === tokenTypes.COMMENT) { continue; }
        if (token.type === tokenTypes.NEWLINE) {
          state = parserStates.INST_NUM;
        }
        else if (token.type === tokenTypes.REGISTER ||
                 token.type === tokenTypes.CONSTANT) {
          throwParseError("Too many arguments. The " + currentInstToken.val + " instruction only takes " + hmmm.lang.signatures[hmmm.lang.instructions[currentInstToken.val]].length  + " argument(s).");
        }
        else {
          throwParseError("Expected end of line but found " + printableStringForType(token.type));
        }
      }
      
      else if (state === parserStates.ERROR) {
        if (token.type === tokenTypes.NEWLINE) {
          state = parserStates.INST_NUM;
        }
      }
      
    }
    
    if (generatedError) {
      return {
        binary: undefined,
        errors: errors
      }
    }
    
    return {
      binary: bin,
      errors: undefined
    };
    
  }
  
  
  //*********************************************
  //
  // HMMM Assembler API
  //
  //*********************************************

  function assemble(source) {
    var tokens = lex(source);
    return parse(tokens);
  }
  
  hmmm.assembler = {
    lex: lex,
    parse: parse,
    assemble: assemble,
    prettyStringForError: prettyStringForError
  };
  
  
  
  
  //*********************************************
  //
  // HMMM Simulator
  //
  //*********************************************
  

  function createUndoStack() {
    
    var stack = [];
    
    function addUndoMarker() {
      stack.push("MARK");
    }
    
    function addUndoableAction(undoFunction) {
      if (typeof undoFunction !== "function") {
        console.log("Warning: attempted to add non-function to undo stack");
        return;
      };
      stack.push(undoFunction);
    }
    
    function undo() {
      var undoFunction;
      while (stack.length > 0 && (undoFunction = stack.pop()) !== "MARK") {
        undoFunction.call();
      }
    }
    
    function clearStack() {
      stack = [];
    }
    
    return {
      addUndoMarker: addUndoMarker,
      addUndoableAction: addUndoableAction,
      undo: undo,
      clearStack: clearStack
    }
    
  }


  var simulatorStates = Object.freeze({
    EMPTY   : 'EMPTY',
    READY   : 'READY',
    RUN     : 'RUN',
    WAIT    : 'WAIT',
    HALT    : 'HALT',
    ERROR   : 'ERROR'
  });

  var simulatorModes = Object.freeze({
    SAFE   : 'SAFE',
    UNSAFE : 'UNSAFE'
  });

  function createSimulator(inHandler, outHandler, errHandler) {
    
    var NUM_REGISTERS = 16;
    var RAM_SIZE      = 256;

    var machine = {};

    machine.undoStack = createUndoStack();
    
    //---------------------------------------
    // User Defined Input/Output Functions
    //---------------------------------------
    machine.inHandler  = inHandler;
    machine.outHandler = outHandler;
    machine.errHandler = errHandler;
    
    //---------------------------------------
    // Machine State (Public)
    //---------------------------------------
    machine.registers            = [];
    machine.ram                  = [];
    machine.pc                   = 0;
    machine.lastPc               = 0;
    machine.ir                   = 0;
    machine.codeSegmentBoundary  = 0;
    machine.state                = simulatorStates.EMPTY;
    machine.mode                 = simulatorModes.SAFE;

    //---------------------------------------
    // Internal State
    //---------------------------------------
    var readTargetRegister = undefined; // Used to keep track of the register
                                        // associated with a read instruction
                                        // while waiting for user input
    
    for (var i = 0; i < NUM_REGISTERS; ++i) {
      machine.registers.push(0);
    }
    
    for (var j = 0; j < RAM_SIZE; ++j) {
      machine.ram.push(0);
    }
    
    //---------------------------------------
    // Validators
    //---------------------------------------
    
    function isValidInteger(integer) {
      return (integer >= -32768 && integer < 65535);
    }
    
    function isValidJumpTarget(jumpTarget) {
      if (jumpTarget < 0 || jumpTarget >= RAM_SIZE) {
        return false;
      }
      if (machine.mode == simulatorModes.SAFE && jumpTarget >= machine.codeSegmentBoundary) {
        return false;
      }
      return true;
    }
    
    //---------------------------------------
    // Internal State Accessors
    //---------------------------------------
    
    function getProgramCounter() {
      return machine.pc
    }
    
    function setProgramCounter(jumpTarget) {
      var currentPc = getProgramCounter();
      machine.pc = jumpTarget;
      machine.undoStack.addUndoableAction(function() {
        machine.pc = currentPc;
      });
    }
    
    function getLastProgramCounter() {
      return machine.lastPc;
    }
    
    function setLastProgramCounter(lastPc) {
      var currentLastPc = getLastProgramCounter();
      machine.lastPc = lastPc;
      machine.undoStack.addUndoableAction(function() {
        machine.lastPc = currentLastPc;
      });
    }
    
    function getInstructionRegister() {
      return machine.ir;
    }
    
    function setInstructionRegister(binaryInst) {
      if (!isValidInteger(binaryInst)) {
        throwSimulationError("Instruction register overflow");
        return
      }
      var currentIr = getInstructionRegister();
      machine.ir = binaryInst;
      machine.undoStack.addUndoableAction(function() {
        machine.ir = currentIr;
      });
    }
    
    function getRegister(register) {
      if (register < 0 || register >= NUM_REGISTERS) {
        throwSimulationError("Attempted to access invalid register: r" + register);
        return;
      }
      return machine.registers[register];
    }
    
    function setRegister(register, value) {
      if (register < 0 || register >= NUM_REGISTERS) {
        throwSimulationError("Attempted to access invalid register: r" + register);
        return;
      }
      if (!isValidInteger(value)) {
        throwSimulationError("Register overflow");
        return;
      }
      if (register === 0) {
        return; // Register 0 is always 0
      }
      var currentValue = getRegister(register);
      machine.registers[register] = value;
      machine.undoStack.addUndoableAction(function() {
        machine.registers[register] = currentValue;
      })
    }
    
    function getRam(address) {
      if (address < 0 || address >= RAM_SIZE) {
        throwSimulationError("Attempted to access invalid ram address: " + address);
        return;
      }
      return machine.ram[address];
    }
    
    function setRam(address, value) {
      if (address < 0 || address >= RAM_SIZE) {
        throwSimulationError("Attempted to access invalid ram address: " + address);
        return;
      }
      if (machine.mode = simulatorModes.SAFE && address < machine.codeSegmentBoundary) {
        throwSimulationError("Attempted to write into code segment of RAM");
        return;
      }
      if (!isValidInteger(value)) {
        throwSimulationError("Integer overflow");
        return;
      }
      var currentValue = getRam(address);
      machine.ram[address] = value;
      machine.undoStack.addUndoableAction(function() {
        machine.ram[address] = currentValue;
      });
    }
    
    function getMachineState() {
      return machine.state;
    }
    
    function setMachineState(newState) {
      var currentState = getMachineState();
      machine.state = newState;
      machine.undoStack.addUndoableAction(function() {
        machine.state = currentState;
      });
    }
    
    //---------------------------------------
    // Simulation Functions
    //---------------------------------------
    
    function throwSimulationError(message) {
      setMachineState(simulatorStates.ERROR);
      if (errHandler) {
        errHandler("ERROR: " + message);
      }
    }
    
    function executeInstruction(operation, args) {
      // Unpack Arguments
      var rx, ry, rz, n;
      var signature = hmmm.lang.signatures[operation];
      
      var argNum = 0; // Must keep track separately from loop iteration due
                      // to signatures containing 'z'
      for (var i = 0; i < signature.length; ++i) {
        var type = signature.charAt(i);
        if (type === "r") {
          var arg = +(args[argNum].slice(1));
          // Declare registers in order
          if (rx === undefined) {
            rx = arg;
          }
          else if (ry === undefined) {
            ry = arg;
          }
          else if (rz === undefined) {
            rz = arg;
          }
          else {
            throwSimulationError("Internal inconsistency error");
            return;
          }
          argNum += 1;
        }
        else if (type === "u" || type === "s") {
          n = +(args[argNum]);
          argNum += 1;
        }
        else if (type === "z"){
          // Do nothing
          // And don't increment argNum
        }
        else {
          throwSimulationError("Internal inconsistency error");
          return;
        }
      }
      
      // Handle halt as a special case
      if (operation === "halt") {
        setMachineState(simulatorStates.HALT);
        setProgramCounter(getLastProgramCounter());
      }
      else if (operation === "read") {
        readTargetRegister = rx;
        setMachineState(simulatorStates.WAIT);
        return;
        // var input = inHandler();
        // var validInput = /^-?[0-9]+$/.test(input) || /^-?0[xX][0-9a-fA-F]+$/.test(arg);
        // if (!validInput) {
        //   throwSimulationError("Invalid user input");
        //   return;
        // };
        // var parsedInput = parseInt(input);
        // setRegister(rx, input);
      }
      else if (operation === "write") {
        var data = getRegister(rx);
        if (outHandler) {
          outHandler(data);
        }
      }
      else if (operation === "jumpr") {
        var data = getRegister(rx);
        if (!isValidJumpTarget(data)) {
          throwSimulationError("Invalid jump target");
          return;
        }
        setProgramCounter(data);
      }
      else if (operation === "setn") {
        setRegister(rx, n);
      }
      else if (operation === "loadn") {
        var data = getRam(n);
        setRegister(rx, data);
      }
      else if (operation === "storen") {
        var data = getRegister(rx);
        setRam(n, data);
      }
      else if (operation === "loadr") {
        var address = getRegister(ry);
        var data = getRam(address);
        setRegister(rx, data);
      }
      else if (operation === "storer") {
        var data = getRegister(rx);
        var address = getRegister(ry);
        setRam(address, data);
      }
      else if (operation === "addn") {
        var data = getRegister(rx);
        setRegister(rx, data + n);
      }
      else if (operation === "nop") {
        // Do nothing
      }
      else if (operation === "copy") {
        var data = getRegister(ry);
        setRegister(rx, data);
      }
      else if (operation === "add") {
        var data1 = getRegister(ry);
        var data2 = getRegister(rz);
        setRegister(rx, data1 + data2);
      }
      else if (operation === "neg") {
        var data = getRegister(ry);
        setRegister(rx, -data);
      }
      else if (operation === "sub") {
        var data1 = getRegister(ry);
        var data2 = getRegister(rz);
        setRegister(rx, data1 - data2);
      }
      else if (operation === "mul") {
        var data1 = getRegister(ry);
        var data2 = getRegister(rz);
        setRegister(rx, data1 * data2);
      }
      else if (operation === "div") {
        var data1 = getRegister(ry);
        var data2 = getRegister(rz);
        if (data2 === 0) {
          throwSimulationError("Division by zero");
          return;
        }
        setRegister(rx, parseInt(data1 / data2));
      }
      else if (operation === "mod") {
        var data1 = getRegister(ry);
        var data2 = getRegister(rz);
        if (data2 === 0) {
          throwSimulationError("Division by zero");
          return
        };
        setRegister(rx, data1 % data2);
      }
      else if (operation === "jumpn") {
        if (!isValidJumpTarget(n)) {
          throwSimulationError("Invalid jump target");
          return;
        }
        setProgramCounter(n);
      }
      else if (operation === "calln") {
        var nextInst = getProgramCounter(); // We've already bumped at this point
        setRegister(rx, nextInst);
        setProgramCounter(n);
      }
      else if (operation === "jeqzn") {
        var data = getRegister(rx);
        if (data === 0) {
          if (!isValidJumpTarget(n)) {
            throwSimulationError("Invalid jump target");
            return;
          }
          setProgramCounter(n);
        }
      }
      else if (operation === "jnezn") {
        var data = getRegister(rx);
        if (data !== 0) {
          if (!isValidJumpTarget(n)) {
            throwSimulationError("Invalid jump target");
            return;
          }
          setProgramCounter(n);
        }
      }
      else if (operation === "jgtzn") {
        var data = getRegister(rx);
        if (data > 0) {
          if (!isValidJumpTarget(n)) {
            throwSimulationError("Invalid jump target");
            return;
          }
          setProgramCounter(n);
        }
      }
      else if (operation === "jltzn") {
        var data = getRegister(rx);
        if (data < 0) {
          if (!isValidJumpTarget(n)) {
            throwSimulationError("Invalid jump target");
            return;
          }
          setProgramCounter(n);
        }
      }
      else {
        throwSimulationError("Unknown operation");
        return;
      }
    }
    
    //---------------------------------------
    // Public Functions
    //---------------------------------------
    function resetMachine(clearProgram) {
      machine.pc = 0;
      machine.lastPc = 0;
      machine.ir = 0;
      
      if (clearProgram) {
        machine.codeSegmentBoundary = 0;
      }
      
      for (var i = 0; i < machine.registers.length; ++i) {
        machine.registers[i] = 0;
      }
      
      for (var j = machine.codeSegmentBoundary; j < machine.ram.length; ++j) {
        machine.ram[j] = 0;
      }
      
      if (clearProgram) {
        setMachineState(simuatorStates.EMPTY);
      }
      else {
        setMachineState(simulatorStates.READY);
      }
      machine.undoStack.clearStack();
    }
    
    function loadBinary(binary) {
      var instructions = [];
      binary.split("\n").forEach(function(line) {
        if (line.trim() === "") {
          return;
        }
        instructions.push(parseInt(line.replace(/ /g, ""), 2));
      });
      for (var i = 0; i < instructions.length; ++i) {
        machine.ram[i] = instructions[i];
      }
      machine.codeSegmentBoundary = instructions.length;
      resetMachine(false);
    }
    
    function runNextInstruction() {
      if (machine.state === simulatorStates.WAIT) {
        console.log("Simulator is waiting for user input");
        return;
      }
      machine.undoStack.addUndoMarker();
      var progCounter = getProgramCounter();
      if (machine.mode === simulatorModes.SAFE && (progCounter < 0 || progCounter >= machine.codeSegmentBoundary)) {
        throwSimulationError("Attempted to execute instruction outside of code segment");
        return;
      }
      var binInst = getRam(progCounter);
      setInstructionRegister(binInst);
      var decoded = decodeBinaryInstruction(getInstructionRegister());
      if (!decoded) {
        machine.undoStack.undo();
        throwSimulationError("Unable to decode instruction");
        return;
      }
      setLastProgramCounter(progCounter);
      setProgramCounter(progCounter + 1);
      executeInstruction(decoded.operation, decoded.args);
    }
    
    // function run(willExecute, didExecute) {
    //   if (getMachineState() == simulatorStates.EMPTY) {
    //     throwSimulationError("No code loaded into machine");
    //     return;
    //   }
    //   if (getMachineState() == simulatorStates.HALT) {
    //     return;
    //   }
    //   if (getMachineState() == simulatorStates.ERROR) {
    //     return;
    //   }
    //   setMachineState(simulatorStates.RUN);
    //   while (getMachineState() === simulatorStates.RUN) {
    //     if (willExecute) {
    //       willExecute();
    //     }
    //     runNextInstruction();
    //     if (didExecute) {
    //       didExecute();
    //     }
    //   }
    // }
    
    function stepBackward() {
      machine.undoStack.undo();
    }

    function readInput(input) {
      var rx = readTargetRegister;
      var validInput = /^-?[0-9]+$/.test(input) || /^-?0[xX][0-9a-fA-F]+$/.test(input);
      if (!validInput) {
        throwSimulationError("Invalid user input");
        return false;
      };
      var parsedInput = parseInt(input);
      setRegister(rx, parsedInput);
      setMachineState(simulatorStates.READY);
      readTargetRegister = undefined;
      return true;
    }

    machine.resetMachine = resetMachine;
    machine.loadBinary = loadBinary;
    machine.runNextInstruction = runNextInstruction;
    // machine.run = run;
    machine.stepBackward = stepBackward;
    machine.readInput = readInput;
    
    return machine;
    
  }
  
  //*********************************************
  //
  // HMMM Simulator API
  //
  //*********************************************

  hmmm.simulator = {
    simulatorStates: simulatorStates,
    simulatorModes: simulatorModes,
    createSimulator: createSimulator
  };
  
 })();
