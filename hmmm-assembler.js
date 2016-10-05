var hmmm = require('./hmmm-language');

//*********************************************
// Tokens
//*********************************************

var tokenTypes = Object.freeze({
  INSTRUCTION : "INSTRUCTION",
  REGISTER    : "REGISTER",
  CONSTANT    : "CONSTANT",
  COMMENT     : "COMMENT",
  NEWLINE     : "NEWLINE"
});

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

//*********************************************
// Lexer
//*********************************************

function HmmmLexer() {
  
  'use strict'
  
  // Helper Functions
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
    return /^[a-zA-Z]+$/.test(string);
  }
  
  function isTokenBreak(character) {
    return (character === undefined || isWhitespace(character) || isNewline(character) || character === ",");
  }
  
  this.lex = function(source) {
    
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
      while (!isTokenBreak(next)) {
        peek = getNextChar();
        chars += peek;
        next = lookAhead(1);
      }
      return chars;
    }
    
    function scanToLineBreak() {
      var chars = peek;
      var next = lookAhead(1);
      while (!isNewline(next)) {
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
        if (isWhitespace(peek) || ((peek === "," && currentLine.tokens[currentLine.tokens.length - 1]).type === tokenTypes.REGISTER)) {
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
  
}

//*********************************************
// Parser
//*********************************************


function HmmmParser() {
  
  // 'use strict'
  
  // Error constructor
  
  function createParseError(range, message) {
    return {
      range: range,
      message: message
    };
  };
  
  // Argument validators
  
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
  
  // Binary helper methods
  
  function padZeroesLeft(string, width) {
    var pad = "";
    for (var i = 0; i < width - string.length; ++i) {
      pad += "0";
    }
    return pad + string;
  }

  function binaryForRegister(register) {
    var bin_string = (+(register.slice(1))).toString(2);
    return padZeroesLeft(bin_string, 4);
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
  
  function binaryForTokens(instToken, argTokens) {
    // At this point, we assume that the tokens are formed correctly and in the
    // right order, so we forgo error checking in this function
    
    // Get standarized instruction name (i.e., resolve aliases)
    var inst = hmmm.instructions[instToken.val];
    var signature = hmmm.signatures[inst];
    var unpaddedSignature = signature.replace(/z/, ""); // Remove z's (since they only represent padding)
    var expectedNumArgs = unpaddedSignature.length;
    
    // Start with the opcode
    var opcode = hmmm.opcodes[inst].opcode;
    
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
  
  // this.parse = function(tokenizedLines) {
    
  //   var expectedInstNum = 0;
  //   var binary = "";
  //   var errors = [];
    
  //   for (var i = 0; i < tokenizedLines.length; ++i) {
  //     var line = tokenizedLines[i];
  //     var tokens = line.tokens;
      
  //     // Do all error checking first
  //     // Bail and try to parse next line as soon as any error is found
      
  //     if (tokens.length === 0) {
  //       // The only way this happens is if the tokenized lines are malformed
  //       // Big error so bail completely
  //       var range = createRange(1, 1, 1, 1);
  //       errors.push(createParseError(range, "Internal Parser Error"));
  //       break;
  //     }
      
  //     // Check for the correct instruction number
  //     var instNumToken = tokens[0];
  //     if (instNumToken.type !== tokenTypes.CONSTANT || instNumToken.val !== expectedInstNum) {
  //       errors.push(createParseError(instNumToken.range, "Expected instruction number: " + expectedInstNum));
  //       // If the value was at least an integer, try to recover by resetting the expectedInstNum
  //       if (instNumToken.type === tokenTypes.CONSTANT && instNumToken.val >= 0) {
  //         expectedInstNum = instNumToken.val + 1;
  //       }
  //       continue;
  //     }
      
  //     // If we get this far, we're going to try to parse the rest of the line,
  //     // so we increase expectedInstNum in an effort to recover parsing on the
  //     // next line if we run into any errors on this one
  //     expectedInstNum += 1;
      
  //     // Check for a valid instruction
  //     if (tokens.length < 2) {
  //       var errorRange = createRange(instNumToken.range.end, instNumToken.range.end);
  //       errors.push(createParseError(errorRange, "Missing instruction"));
  //       continue;
  //     }
  //     var instToken = tokens[1];
  //     if (instToken.type !== tokenTypes.INSTRUCTION) {
  //       errors.push(createParseError(instToken.range, "Expected instruction, found " + instToken.type.toLowerCase()));
  //       continue;
  //     }
  //     if (Object.keys(hmmm.instructions).indexOf(instToken.val) === -1) {
  //       errors.push(createParseError(instToken.range, "Invalid instruction"));
  //       continue;
  //     }
      
      
  //     // Get instruction and arguments
  //     var inst = hmmm.instructions[instToken.val]; // Resolve aliases
  //     var argTokens = tokens.slice(2);
      
  //     // Check for proper number of arguments
  //     var signature = hmmm.signatures[inst];
  //     var unpaddedSignature = signature.replace(/z/, ""); // Remove z's (since they only represent padding)
  //     var expectedArgs = unpaddedSignature.length;
  //     if (expectedArgs !== argTokens.length) {
  //       var start = undefined;
  //       var end   = undefined;
        
  //       if (argTokens.length === 0) {
  //         start  = instToken.range.end;
  //         end    = instToken.range.end;
  //       }
  //       else {
  //         start = argTokens[0].range.start;
          
  //         var lastArg = argTokens[argTokens.length - 1];
  //         end = lastArg.range.end;
  //       }
  //       var range = createRange(start, end);
  //       errors.push(createParseError(range, "Wrong number of arguments. Expected: " + expectedArgs + ". Found: " + argTokens.length + "."));
        
  //       continue;
  //     }
      
  //     // Check for arguments for types and validity
  //     var generatedError = false;
  //     for (var j = 0; j < unpaddedSignature.length; ++j) {
  //       var argType = unpaddedSignature[j];
  //       var argToken = argTokens[j];
        
  //       // Register Args
  //       if (argType === 'r') {
  //         if (argToken.type !== tokenTypes.REGISTER) {
  //           errors.push(createParseError(argToken.range, "Wrong argument type. Expected register, found " + argToken.type.toLowerCase()));
  //           generatedError = true;
  //           break;
  //         }
  //         if (!isValidRegisterArgument(argToken.val)) {
  //           errors.push(createParseError(argToken.range, "Invalid register argument (must be r0-r15). Found " + argToken.val));
  //           generatedError = true;
  //           break;
  //         }
  //       }
  //       // Signed 8-bit args
  //       else if (argType === 's') {
  //         if (argToken.type !== tokenTypes.CONSTANT) {
  //           errors.push(createParseError(argToken.range, "Wrong argument type. Expected signed integer, found " + argToken.type.toLowerCase()));
  //           generatedError = true;
  //           break;
  //         }
  //         if (!isValidSignedArgument(argToken.val)) {
  //           errors.push(createParseError(argToken.range, "Invalid signed integer argument (must be between -128 and 127). Found " + argToken.val));
  //           generatedError = true;
  //           break;
  //         }
  //       }
  //       // Unsigned 8-bit args
  //       else if (argType === 'u') {
  //         if (argToken.type !== tokenTypes.CONSTANT) {
  //           errors.push(createParseError(argToken.range, "Wrong argument type. Expected unsigned integer, found " + argToken.type.toLowerCase()));
  //           generatedError = true;
  //           break;
  //         }
  //         if (!isValidUnsignedArgument(argToken.val)) {
  //           errors.push(createParseError(argToken.range, "Invalid unsigned integer argument (must be between 0 and 255). Found " + argToken.val));
  //           generatedError = true;
  //           break;
  //         }
  //       }
  //       // Any other signature value
  //       else {
  //         errors.push(createParseError(argToken.range, "Internal Parser Error. Unknown argument signature type."));
  //         generatedError = true;
  //         break;
  //       }
        
  //     }
  //     if (generatedError) {
  //       continue;
  //     }
      
  //     // Create binary for instruction and args and add to binary output string
  //     var binForLine = spaceIntoNibbles(binaryForTokens(instToken, argTokens)) + '\n';
  //     binary += binForLine;
      
  //   }
    
  //   if (errors.length > 0) {
  //     return {
  //       binary: undefined,
  //       errors: errors,
  //     };
  //   };
    
  //   return { 
  //     binary: binary, 
  //     errors: errors
  //   };
    
  // }
  
  // Indicates what the parser is "looking for"
  var parserStates = Object.freeze({
    INST_NUM     : "INST_NUM",
    INST         : "INST",
    REGISTER     : "REGISTER",
    UNSIGNED_INT : "UNSIGNED_INT",
    SIGNED_INT   : "SIGNED_INT",
    NEWLINE      : "NEWLINE",
    ERROR        : "ERROR"
  });
  
  this.parse = function(tokens, source) {
    
    var state = parserStates.INST_NUM;
    var nextInstNum = 0;
    var nextArgTypes = [];
    var currentInstToken = undefined;
    var currentArgTokens = [];
    
    var token = undefined;
    var bin = "";
    
    var generatedError = false;
    
    function throwParseError(message) {
      console.log("ERROR [" + token.range.start.row + ":" + token.range.start.column + "]: " + message);
      if (source !== undefined) {
        var lines = source.split("\n");
        console.log(lines[token.range.start.row - 1]);
        var caratString = "\033[31m"; // Draw the error in red
        for (var k = 0; k < token.range.start.column - 1; ++k) {
          caratString += " ";
        }
        caratString += "^";
        for (var k = 0; k < token.range.end.column - token.range.start.column - 1; ++k) {
          caratString += "~";
        }
        caratString += "\033[0m";
        console.log(caratString);
      }
      
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
            throwParseError("Expected instruction number " + nextInstNum + " but found " + token.val);
            
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
          throwParseError("Expected an instruction number but found " + token.type);
        }
        
      }
      
      // Checking for an instruction
      else if (state === parserStates.INST) {
        
        if (token.type === tokenTypes.INSTRUCTION) {
          
          // Figure out what the next parser states should be and keep them in a queue
          var currentInstToken = token;
          
          if (!(token.val in hmmm.instructions)) {
            throwParseError("Unknown instruction");
            continue;
          }
          
          var argSignature = hmmm.signatures[hmmm.instructions[token.val]]; // Resolve aliases before grabbing signature
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
          throwParseError("Expected an instruction but found " + token.type);
        }
      }
      
      // Checking for a register argument
      else if (state === parserStates.REGISTER) {
        if (token.type === tokenTypes.REGISTER) {
          
          currentArgTokens.push(token);
          transitionStateToNextArgType();
          
        }
        else {
          throwParseError("Expected a register argument but found " + token.type);
        }
      }
      
      // Checking for an unsigned integer argument
      else if (state === parserStates.UNSIGNED_INT) {
        if (token.type === tokenTypes.CONSTANT) {
          
          currentArgTokens.push(token);
          transitionStateToNextArgType();
          
        }
        else {
          throwParseError("Expected an unsigned integer argument but found " + token.type);
        }
      }
      
      // Checking for a signed integer argument
      else if (state === parserStates.SIGNED_INT) {
        if (token.type === tokenTypes.CONSTANT) {
          
          currentArgTokens.push(token);
          transitionStateToNextArgType();
          
        }
        else {
          throwParseError("Expected an signed integer argument but found " + token.type);
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
          throwParseError("Too many arguments. The " + currentInstToken.val + " instruction only takes " + hmmm.signatures[hmmm.instructions[currentInstToken.val]].length  + " argument(s).");
        }
        else {
          throwParseError("Expected end of line but found " + token.type);
        }
      }
      
      else if (state === parserStates.ERROR) {
        if (token.type === tokenTypes.NEWLINE) {
          state = parserStates.INST_NUM;
        }
      }
      
    }
    
    if (generatedError) {
      return undefined;
    }
    
    return bin;
    
  }
  
}

//*********************************************
// Assembler (Public)
//*********************************************

function HmmmAssembler() {
  
  'use strict';

  this.assemble = function(source) {
    var lexer = new HmmmLexer();
    var parser = new HmmmParser();
    var tokens = lexer.lex(source);
    return parser.parse(tokens);
  }
  
}

module.exports = exports = {
  lexer: HmmmLexer,
  parser: HmmmParser,
  assembler: HmmmAssembler
};
