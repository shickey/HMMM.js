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
  
  function Token(type) {
    this.type = type;
  }
  
  function InstructionToken(inst) {
    InstructionToken.super_.call(this, tokenTypes.INSTRUCTION);
    this.val = inst;
  }
  
  function RegisterToken(reg) {
    RegisterToken.super_.call(this, tokenTypes.REGISTER);
    this.val = reg;
  }
  
  function ConstantToken(constant) {
    ConstantToken.super_.call(this, tokenTypes.CONSTANT);
    this.val = constant;
  }
  
  function UnknownToken(value) {
    UnknownToken.super_.call(this, tokenTypes.UNKNOWN);
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
  
  function isDigit(character) {
    return /^[0-9]$/.test(character);
  }
  
  function isAlpha(character) {
    return /^[a-zA-Z]$/.test(character);
  }
  
  function isTokenBreak(character) {
    return (character === undefined || isWhitespace(character) || isNewline(character));
  }
  
  this.lex = function(source) {
    
    var tokenizedLines = [];
    var currentLine = undefined;
    var lineNum = 1;
    
    // Inner functions for scanning
    var currPos = 0;
    function getNextChar() {
      if (currPos >= source.length) {
        return undefined;
      }
      var nextChar = source[currPos];
      currPos += 1;
      return nextChar;
    }
    
    function lookAhead(numChars) {
      if (currPos >= source.length) {
        return undefined;
      }
      return source.slice(currPos, currPos + numChars);
    }
    
    function scanToTokenBreak() {
      var chars = "";
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
    
    
    var peek = '';
    
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
      
      // Numeric constants (including negative values)
      if (isDigit(peek) || (peek === '-' && isDigit(lookAhead(1)))) {
        var num = undefined;
        if (peek == '-') {
          peek = getNextChar();
          num = (+peek) * -1;
        }
        else {
          num = (+peek);
        }
        
        while (isDigit(lookAhead(1))) {
          peek = getNextChar();
          num = (num * 10) + (+peek); // Convert to int
        }
        
        if (isTokenBreak(lookAhead(1))) {
          addToken(new ConstantToken(num));
          continue;
        }
        else {
          num = "" + num;
          num += scanToTokenBreak();
          addToken(new UnknownToken(num));
          continue;
        }
      }
      
      // Registers
      if (peek === 'r' || peek === 'R') {
        // First, check to see if next character is numerical
        // Only lex as register if so
        if (isDigit(lookAhead(1))) {
          var reg = 'r'
          while(isDigit(lookAhead(1))) {
            peek = getNextChar();
            reg += peek
          }
          if (isTokenBreak(lookAhead(1))) {
            addToken(new RegisterToken(reg));
            continue;
          }
          else {
            reg += scanToTokenBreak();
            addToken(new UnknownToken(reg))
            continue;
          }
        }
      }
      
      // Instructions
      if (isAlpha(peek)) {
        var inst = peek;
        while (isAlpha(lookAhead(1))) {
          peek = getNextChar();
          inst += peek;
        }
        if (isTokenBreak(lookAhead(1))) {
          addToken(new InstructionToken(inst));
          continue;
        }
        else {
          inst += scanToTokenBreak();
          addToken(new UnknownToken(inst));
          continue;
        }
      }
      
      // Anything else
      if (peek !== undefined) {
        var unknown = peek;
        while (peek !== undefined && !isWhitespace(lookAhead(1))) {
          peek = getNextChar();
          unknown += peek;
        }
        addToken(new UnknownToken(unknown));
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
