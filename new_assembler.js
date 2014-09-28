var util = require('util');

function HmmmLexer() {
  
  'use strict'
  
  // Token Constructors
  
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
    return (character === undefined || isWhitespace(character) || isNewline(character));
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
        if (isWhitespace(peek)) {
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
        while (!isNewline(lookAhead(1))) {
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

function HmmmAssembler() {
  
  'use strict';
  
  //
  // Public Interface
  //
  this.assemble = function(source) {
    var lexer = new HmmmLexer();
    var tokens = lexer.lex(source);
    
    return tokens;
  }
  
}

module.exports = exports = HmmmAssembler;
