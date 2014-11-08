!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.HmmmSimulator=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
var hmmm = require('./hmmm-language');


function HmmmSimulator(inHandler, outHandler, errHandler) {
  
  'use strict'
  
  var machine = this;
  
  var NUM_REGISTERS = 16;
  var RAM_SIZE      = 256;
  
  var states = Object.freeze({
    EMPTY   : 'empty',
    READY   : 'ready',
    RUN     : 'run',
    PAUSE   : 'pause',
    HALT    : 'halt',
    ERROR   : 'error'
  });
  
  var modes = Object.freeze({
    SAFE   : 'safe',
    UNSAFE : 'unsafe'
  });
  
  //*********************************************
  // User Defined Input/Output Functions
  //*********************************************
  this.inHandler  = inHandler;
  this.outHandler = outHandler;
  this.errHandler = errHandler;
  
  //*********************************************
  // Public State
  //*********************************************
  this.states    = states;
  this.registers = [];
  this.ram       = [];
  this.pc        = 0;
  this.ir        = 0;
  this.boundary  = 0;
  this.state     = states.EMPTY;
  this.mode      = modes.SAFE;
  
  for (var i = 0; i < NUM_REGISTERS; ++i) {
    this.registers.push(0);
  }
  
  for (var j = 0; j < RAM_SIZE; ++j) {
    this.ram.push(0);
  }
  
  //*********************************************
  // Private Methods
  //*********************************************
  
  function validInteger(integer) {
    return (integer >= -32768 && integer < 65535);
  }
  
  function getProgramCounter() {
    return machine.pc
  }
  
  function setProgramCounter(jumpTarget) {
    if (jumpTarget < 0 || jumpTarget >= NUM_REGISTERS) {
      throwSimulationError("Invalid jump target");
      return;
    }
    if (machine.mode == modes.SAFE && jumpTarget >= machine.boundary) {
      throwSimulationError("Invalid jump target");
      return;
    }
    machine.pc = jumpTarget;
  }
  
  function getInstructionRegister() {
    return machine.ir;
  }
  
  function setInstructionRegister(binaryInst) {
    if (!validInteger(binaryInst)) {
      throwSimulationError("Instruction register overflow");
      return
    }
    machine.ir = binaryInst;
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
    if (!validInteger(value)) {
      throwSimulationError("Register overflow");
      return;
    }
    if (register === 0) {
      return; // Register 0 is always 0
    }
    machine.registers[register] = value;
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
    if (machine.mode = modes.SAFE && address < machine.boundary) {
      throwSimulationError("Attempted to write into code segment of RAM");
      return;
    }
    if (!validInteger(value)) {
      throwSimulationError("Integer overflow");
      return;
    }
    machine.ram[address] = value;
  }
  
  function throwSimulationError(message) {
    machine.state = machine.states.ERROR;
    if (machine.errHandler) {
      machine.errHandler("ERROR: " + message);
    }
  }
  
  function decodeBinaryInstruction(binInst) {
    var encoded = binInst;
    var decoded = {
      operation : null,
      args      : []
    };
    
    // Find the correct operation by iterating over the
    // list of instructions in order of precedence
    hmmm.opcodePrecedence.some(function(operation){
      var opcode = parseInt(hmmm.opcodes[operation].opcode, 2);
      var mask   = parseInt(hmmm.opcodes[operation].mask,   2);
      if ((encoded & mask) === opcode) {
        // We found the right operation
        decoded.operation = operation;
        return true;
      }
    });
    
    if (!decoded.operation) {
      // We couldn't decode the operation
      return;
    }
    
    // Parse Arguments
    var signature = hmmm.signatures[decoded.operation];
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
        // Internal inconsistency error
        return;
      }
    }
    return decoded;
  }
  
  function executeInstruction(operation, args) {
    // Unpack Arguments
    var rx, ry, rz, n;
    var signature = hmmm.signatures[operation];
    
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
      machine.state = states.HALT;
      return;
    }
    
    // If we didn't halt, bump the instruction number
    setProgramCounter(getProgramCounter() + 1);
    
    // If we didn't halt, execute the correct instruction
    if (operation === "read") {
      var userInput = machine.inHandler();
      var validInput = /^-?[0-9]+$/.test(userInput) || /^-?0[xX][0-9a-fA-F]+$/.test(arg);
      if (!validInput) {
        throwSimulationError("Invalid user input");
        return;
      };
      var parsedInput = parseInt(userInput);
      setRegister(rx, parsedInput);
    }
    else if (operation === "write") {
      var data = getRegister(rx);
      if (machine.outHandler) {
        machine.outHandler(data);
      }
    }
    else if (operation === "jumpr") {
      var data = getRegister(rx);
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
        setProgramCounter(n);
      }
    }
    else if (operation === "jnezn") {
      var data = getRegister(rx);
      if (data !== 0) {
        setProgramCounter(n);
      }
    }
    else if (operation === "jgtzn") {
      var data = getRegister(rx);
      if (data > 0) {
        setProgramCounter(n);
      }
    }
    else if (operation === "jltzn") {
      var data = getRegister(rx);
      if (data < 0) {
        setProgramCounter(n);
      }
    }
    else {
      throwSimulationError("Unknown operation");
      return;
    }
  }
  
  //*********************************************
  // Public Methods
  //*********************************************
  this.resetMachine = function(clearProgram) {
    machine.pc = 0;
    
    if (clearProgram) {
      machine.boundary = 0;
    }
    
    for (var i = 0; i < machine.registers.length; ++i) {
      machine.registers[i] = 0;
    }
    
    for (var j = machine.boundary; j < machine.ram.length; ++j) {
      machine.ram[j] = 0;
    }
    
    if (clearProgram) {
      machine.state = states.EMPTY;
    }
    else {
      machine.state = states.READY;
    }
    
  }
  
  this.loadBinary = function(binary) {
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
    machine.boundary = instructions.length;
    machine.resetMachine(false);
  }
  
  this.runNextInstruction = function() {
    var progCounter = getProgramCounter();
    var binInst = getRam(progCounter);
    setInstructionRegister(binInst);
    var decoded = decodeBinaryInstruction(getInstructionRegister());
    if (!decoded) {
      throwSimulationError("Unable to decode instruction");
      return;
    }
    executeInstruction(decoded.operation, decoded.args);
  }
  
  this.run = function(willExecute, didExecute) {
    if (machine.state == states.EMPTY) {
      throwSimulationError("No code loaded into machine");
      return;
    }
    if (machine.state == states.HALT) {
      return;
    }
    if (machine.state == states.ERROR) {
      return;
    }
    machine.state = states.RUN;
    while (machine.state === states.RUN) {
      if (willExecute) {
        willExecute();
      }
      machine.runNextInstruction();
      if (didExecute) {
        didExecute();
      }
    }
  }
  
  this.instructionFromBinary = function(binInst) {
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
  
}

module.exports = exports = HmmmSimulator;
},{"./hmmm-language":1}]},{},[2])(2)
});