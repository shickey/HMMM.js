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
  
  //*********************************************
  // User Defined Input/Output Functions
  //*********************************************
  this.inHandler  = inHandler;
  this.outHandler = outHandler;
  this.errHandler = errHandler;
  
  //*********************************************
  // Public State
  //*********************************************
  this.executionDelay = 500; // Milliseconds between instruction executions
  
  this.registers = [];
  this.ram       = [];
  this.pc        = 0;
  this.boundary  = 0;
  this.state     = states.EMPTY;
  
  for (var i = 0; i < NUM_REGISTERS; ++i) {
    this.registers.push(0);
  }
  
  for (var j = 0; j < RAM_SIZE; ++j) {
    this.ram.push(0);
  }
  
  //*********************************************
  // Private Methods
  //*********************************************
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
      // TODO Throw, we couldn't decode the operation
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
        // TODO throw, internal inconsistency
      }
    }
    return decoded;
  }
  
  function executeInstruction(operation, args) {
    // Bump the instruction number
    machine.pc += 1
    
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
          // TODO Internal inconsistency error
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
        // TODO Throw internal inconsistency error
      }
    }
    
    // Now actually execute the correct operation
    if (operation === "halt") {
      machine.state = states.HALT;
    }
    else if (operation === "read") {
      var userInput = machine.inHandler();
      machine.registers[rx] = userInput;
    }
    else if (operation === "write") {
      var data = machine.registers[rx];
      machine.outHandler(data);
    }
    else if (operation === "jumpr") {
      var data = machine.registers[rx];
      machine.pc = data;
    }
    else if (operation === "setn") {
      machine.registers[rx] = n;
    }
    else if (operation === "loadn") {
      var data = getRam(n);
      machine.registers[rx] = data;
    }
    else if (operation === "storen") {
      var data = machine.registers[rx];
      machine.ram[n] = data;
    }
    else if (operation === "loadr") {
      var address = machine.registers[ry];
      var data = getRam(address);
      machine.registers[rx] = data;
    }
    else if (operation === "storer") {
      var data = machine.registers[rx];
      var address = machine.registers[ry];
      machine.ram[address] = data;
    }
    else if (operation === "addn") {
      var data = machine.registers[rx];
      machine.registers[rx] = data + n;
    }
    else if (operation === "nop") {
      // Do nothing
    }
    else if (operation === "copy") {
      var data = machine.registers[ry];
      machine.registers[rx] = data;
    }
    else if (operation === "add") {
      var data1 = machine.registers[ry];
      var data2 = machine.registers[rz];
      machine.registers[rx] = data1 + data2;
    }
    else if (operation === "neg") {
      var data = machine.registers[ry];
      machine.registers[rx] = -data;
    }
    else if (operation === "sub") {
      var data1 = machine.registers[ry];
      var data2 = machine.registers[rz];
      machine.registers[rx] = data1 - data2;
    }
    else if (operation === "mul") {
      var data1 = machine.registers[ry];
      var data2 = machine.registers[rz];
      machine.registers[rx] = data1 * data2;
    }
    else if (operation === "div") {
      var data1 = machine.registers[ry];
      var data2 = machine.registers[rz];
      machine.registers[rx] = parseInt(data1 / data2);
    }
    else if (operation === "mod") {
      var data1 = machine.registers[ry];
      var data2 = machine.registers[rz];
      machine.registers[rx] = data1 % data2;
    }
    else if (operation === "jumpn") {
      machine.pc = n;
    }
    else if (operation === "calln") {
      var nextInst = machine.pc; // We've already bumped at this point
      machine.registers[rx] = nextInst;
      machine.pc = n;
    }
    else if (operation === "jeqzn") {
      var data = machine.registers[rx];
      if (data === 0) {
        machine.pc = n;
      }
    }
    else if (operation === "jnezn") {
      var data = machine.registers[rx];
      if (data !== 0) {
        machine.pc = n;
      }
    }
    else if (operation === "jgtzn") {
      var data = machine.registers[rx];
      if (data > 0) {
        machine.pc = n;
      }
    }
    else if (operation === "jltzn") {
      var data = machine.registers[rx];
      if (data < 0) {
        machine.pc = n;
      }
    }
    else {
      // TODO BIG ERROR
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
    if (machine.pc >= machine.boundary) {
      // TODO Throw Error
      return;
    }
    var binInst = machine.ram[machine.pc];
    var decoded = decodeBinaryInstruction(binInst);
    executeInstruction(decoded.operation, decoded.args);
  }
  
  this.run = function() {
    if (machine.state == states.EMPTY) {
      // TODO error
      return;
    }
    if (machine.state == states.HALT) {
      return;
    }
    if (machine.state == states.ERROR) {
      // TODO error
      return;
    }
    machine.state = states.RUN;
    var execute = function() {
      machine.runNextInstruction();
      if (machine.state === states.RUN) {
        setTimeout(execute, machine.executionDelay);
      }
    }
    execute();
  }
  
}

module.exports = exports = HmmmSimulator;