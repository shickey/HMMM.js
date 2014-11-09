!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.HmmmAssembler=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var util = require('util');
var hmmm = require('./hmmm-language');

//*********************************************
// Tokens
//*********************************************

var tokenTypes = Object.freeze({
  INSTRUCTION : "INSTRUCTION",
  REGISTER    : "REGISTER",
  CONSTANT    : "CONSTANT",
  UNKNOWN     : "UNKNOWN"
});

function Token(type, row, column) {
  this.type = type;
  this.row = row;
  this.column = column;
}

function InstructionToken(inst, row, column) {
  InstructionToken.super_.call(this, tokenTypes.INSTRUCTION, row, column);
  this.val = inst;
}

function RegisterToken(reg, row, column) {
  RegisterToken.super_.call(this, tokenTypes.REGISTER, row, column);
  this.val = reg;
}

function ConstantToken(constant, row, column) {
  ConstantToken.super_.call(this, tokenTypes.CONSTANT, row, column);
  this.val = constant;
}

function UnknownToken(value, row, column) {
  UnknownToken.super_.call(this, tokenTypes.UNKNOWN, row, column);
  this.val = value;
}

util.inherits(InstructionToken, Token);
util.inherits(RegisterToken, Token);
util.inherits(ConstantToken, Token);
util.inherits(UnknownToken, Token);

function Line(lineNum) {
  this.lineNum = lineNum;
  this.tokens  = [];
}

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
    return /^-?[0-9]+$/.test(string);
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
    
    var tokenizedLines = [];
    var currentLine = undefined;
    var lineNum = 1;
    var colNum = 0; // Start at 0 since we haven't looked at any characters yet
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
    
    // Inner function for grouping tokens by source code line
    function addToken(token) {
      if (currentLine === undefined) {
        currentLine = new Line(lineNum);
      }
      currentLine.tokens.push(token);
    }
    
    while (peek !== undefined) {
      // Scan over whitespace and find newlines
      while (true) {
        peek = getNextChar();
        if (isWhitespace(peek) || (peek === "," && currentLine.tokens[currentLine.tokens.length - 1] instanceof RegisterToken)) {
          continue;
        }
        else if (isNewline(peek)) {
          if (currentLine) {
            tokenizedLines.push(currentLine);
            currentLine = undefined;
          }
          lineNum += 1;
          colNum = 0;
        }
        else {
          break;
        }
      }
      
      // Ignore comments
      if (peek === '#') {
        while (!isNewline(lookAhead(1)) && peek !== undefined) {
          peek = getNextChar();
        }
        continue;
      }
      
      var startOfToken = colNum;
      var currToken = scanToTokenBreak();
      
      if (currToken === undefined) {
        continue;
      }
      else if (isNumericConstant(currToken)) {
        var num = (+currToken);
        addToken(new ConstantToken(num, lineNum, startOfToken));
      }
      else if (isRegister(currToken)) {
        addToken(new RegisterToken(currToken, lineNum, startOfToken));
      }
      else if (isInstruction(currToken)) {
        addToken(new InstructionToken(currToken, lineNum, startOfToken));
      }
      else {
        addToken(new UnknownToken(currToken, lineNum, startOfToken));
      }

    }
    // Once we've reached EOF, add the last line, if it exists
    if (currentLine) {
      tokenizedLines.push(currentLine);
      currentLine = undefined;
    }
    
    return tokenizedLines;
    
  }
  
}

//*********************************************
// Parser
//*********************************************


function HmmmParser() {
  
  'use strict'
  
  // Error constructor
  
  function ParseError(startRow, startColumn, endRow, endColumn, message) {
    this.startRow = startRow;
    this.startColumn = startColumn;
    this.endRow = endRow;
    this.endColumn = endColumn;
    this.message = message;
  }
  
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
  
  this.parse = function(tokenizedLines) {
    
    var expectedInstNum = 0;
    var binary = "";
    var errors = [];
    
    for (var i = 0; i < tokenizedLines.length; ++i) {
      var line = tokenizedLines[i];
      var tokens = line.tokens;
      
      // Do all error checking first
      // Bail and try to parse next line as soon as any error is found
      
      if (tokens.length === 0) {
        // The only way this happens is if the tokenized lines are malformed
        // Big error so bail completely
        errors.push(new ParseError(1, 1, 1, 1, "Internal Parser Error"));
        break;
      }
      
      // Check for the correct instruction number
      var instNumToken = tokens[0];
      if (!instNumToken instanceof ConstantToken || instNumToken.val !== expectedInstNum) {
        errors.push(new ParseError(instNumToken.row,
                                   instNumToken.column,
                                   instNumToken.row,
                                   instNumToken.column + instNumToken.val.toString().length,
                                   "Expected instruction number: " + expectedInstNum));
        // If the value was at least an integer, try to recover by resetting the expectedInstNum
        if (instNumToken instanceof ConstantToken && instNumToken.val > 0) {
          expectedInstNum = instNumToken.val + 1;
        }
        continue;
      }
      
      // If we get this far, we're going to try to parse the rest of the line,
      // so we increase expectedInstNum in an effort to recover parsing on the
      // next line if we run into any errors on this one
      expectedInstNum += 1;
      
      // Check for a valid instruction
      if (tokens.length < 2) {
        errors.push(new ParseError(instNumToken.row, 
                                   instNumToken.column + instNumToken.val.toString().length,
                                   instNumToken.row,
                                   instNumToken.column + instNumToken.val.toString().length,
                                   "Missing instruction"));
        continue;
      }
      var instToken = tokens[1];
      if (!instToken instanceof InstructionToken) {
        errors.push(new ParseError(instToken.row,
                                   instToken.column,
                                   instToken.row,
                                   instToken.column + instToken.val.toString().length,
                                   "Expected instruction, found " + instToken.type.toLowerCase()));
        continue;
      }
      if (Object.keys(hmmm.instructions).indexOf(instToken.val) === -1) {
        errors.push(new ParseError(instToken.row,
                                   instToken.column,
                                   instToken.row,
                                   instToken.column + instToken.val.toString().length,
                                   "Invalid instruction"));
        continue;
      }
      
      
      // Get instruction and arguments
      var inst = hmmm.instructions[instToken.val]; // Resolve aliases
      var argTokens = tokens.slice(2);
      
      // Check for proper number of arguments
      var signature = hmmm.signatures[inst];
      var unpaddedSignature = signature.replace(/z/, ""); // Remove z's (since they only represent padding)
      var expectedArgs = unpaddedSignature.length;
      if (expectedArgs !== argTokens.length) {
        var startRow = 0;
        var startCol = 0;
        var endRow = startRow;
        var endCol = 0;
        if (argTokens.length === 0) {
          startRow = instToken.row;
          startCol = instToken.column + instToken.val.toString().length
          endCol = instToken.column + instToken.val.toString().length
        }
        else {
          startRow = argTokens[0].row;
          startCol = argTokens[0].column;
          
          var lastArg = argTokens[argTokens.length - 1];
          endCol = lastArg.column + lastArg.val.toString().length;
        }
        errors.push(new ParseError(startRow,
                                   startCol,
                                   endRow,
                                   endCol,
                                   "Wrong number of arguments. Expected: " + expectedArgs + ". Found: " + argTokens.length + "."));
        continue;
      }
      
      // Check for arguments for types and validity
      var generatedError = false;
      for (var j = 0; j < unpaddedSignature.length; ++j) {
        var argType = unpaddedSignature[j];
        var argToken = argTokens[j];
        
        // Register Args
        if (argType === 'r') {
          if (argToken.type !== tokenTypes.REGISTER) {
            errors.push(new ParseError(argToken.row,
                                       argToken.column,
                                       argToken.row,
                                       argToken.column + argToken.val.toString().length,
                                       "Wrong argument type. Expected register, found " + argToken.type.toLowerCase()));
            generatedError = true;
            break;
          }
          if (!isValidRegisterArgument(argToken.val)) {
            errors.push(new ParseError(argToken.row,
                                       argToken.column,
                                       argToken.row,
                                       argToken.column + argToken.val.toString().length,
                                       "Invalid register argument (must be r0-r15). Found " + argToken.val));
            generatedError = true;
            break;
          }
        }
        // Signed 8-bit args
        else if (argType === 's') {
          if (argToken.type !== tokenTypes.CONSTANT) {
            errors.push(new ParseError(argToken.row,
                                       argToken.column,
                                       argToken.row,
                                       argToken.column + argToken.val.toString().length,
                                       "Wrong argument type. Expected signed integer, found " + argToken.type.toLowerCase()));
            generatedError = true;
            break;
          }
          if (!isValidSignedArgument(argToken.val)) {
            errors.push(new ParseError(argToken.row,
                                       argToken.column,
                                       argToken.row,
                                       argToken.column + argToken.val.toString().length,
                                       "Invalid signed integer argument (must be between -128 and 127). Found " + argToken.val));
            generatedError = true;
            break;
          }
        }
        // Unsigned 8-bit args
        else if (argType === 'u') {
          if (argToken.type !== tokenTypes.CONSTANT) {
            errors.push(new ParseError(argToken.row,
                                       argToken.column,
                                       argToken.row,
                                       argToken.column + argToken.val.toString().length,
                                       "Wrong argument type. Expected unsigned integer, found " + argToken.type.toLowerCase()));
            generatedError = true;
            break;
          }
          if (!isValidUnsignedArgument(argToken.val)) {
            errors.push(new ParseError(argToken.row,
                                       argToken.column,
                                       argToken.row,
                                       argToken.column + argToken.val.toString().length,
                                       "Invalid unsigned integer argument (must be between 0 and 255). Found " + argToken.val));
            generatedError = true;
            break;
          }
        }
        // Any other signature value
        else {
          errors.push(new ParseError(argToken.row,
                                     argToken.column,
                                     argToken.row,
                                     argToken.column + argToken.val.toString().length,
                                     "Internal Parser Error. Unknown argument signature type."));
          generatedError = true;
          break;
        }
        
      }
      if (generatedError) {
        continue;
      }
      
      // Create binary for instruction and args and add to binary output string
      var binForLine = spaceIntoNibbles(binaryForTokens(instToken, argTokens)) + '\n';
      binary += binForLine;
      
    }
    
    return { binary: binary, errors: errors }
    
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
    var tokenizedLines = lexer.lex(source);
    return parser.parse(tokenizedLines);
  }
  
}

module.exports = exports = HmmmAssembler;

},{"./hmmm-language":2,"util":6}],2:[function(require,module,exports){
var hmmm = exports = module.exports = (function() { 
  
  'use strict';
  
  return Object.freeze({

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
  
}());

},{}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],5:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],6:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":5,"_process":4,"inherits":3}]},{},[1])(1)
});