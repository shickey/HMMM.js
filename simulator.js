var hmmm   = require('./hmmm_language');
var events = require('events');
var util   = require('util');

function HmmmSimulator(binary) {
  
  'use strict';
  
  events.EventEmitter.call(this);
  
  var that = this;
  
  // Internal State
  var states = Object.freeze({
    EMPTY   : 1,
    READY   : 2,
    RUNNING : 3,
    PAUSED  : 4,
    HALTED  : 5,
    ERROR   : 6
  });
  
  var NUM_REGISTERS = 16;
  var RAM_SIZE      = 256;
  
  var state, boundary, pc, ir, inst, registers, ram;
  
  // Private Interface
  function resetMachine() {
    setMachineState(states.EMPTY); // State of machine (starts with no program loaded)
    boundary  = 0;                 // Index of the first free memory slot (after the program data)
    pc        = 0;                 // Program Counter
    ir        = null;              // Instruction Register (hold binary data)
    inst      = null;              // Decoded Instruction
    registers = [];                // General Purpose Registers r0-r15
    ram       = [];                // Memory
    
    // Instantiate Registers
    for (var i = 0; i < NUM_REGISTERS; ++i) {
      registers.push(0);
    }
    
    // Instantiate Memory
    for (var j = 0 ; j < RAM_SIZE; ++j) {
      ram.push(0);
    }
  }
  
  // Only interact with machine via these getters and setters
  // These will guarantee that r0 is always 0 and throw appropriate
  // errors and such
  function getRegister(register) {
    if (register < 0 || register > NUM_REGISTERS - 1) {
      // TODO Throw invalid register exception
    }
    return registers[register];
  }
  
  function setRegister(register, value) {
    if (register === 0) {
      // Can't set r0
      return;
    }
    
    if (register < 0 || register > NUM_REGISTERS - 1) {
      // TODO Throw invalid register exception
    }
    
    if (value < -32768 || value > 65535) {
      // TODO Throw (warn?) overflow exception
    }
    
    registers[register] = value;
  }
  
  function getRam(address) {
    if (address < 0 || address > RAM_SIZE - 1) {
      // TODO Throw invalid address exception
      // TODO Handle case where attempting to access program segment
    }
    return ram[address];
  }
  
  function setRam(address, value) {
    if (address < 0 || address > RAM_SIZE - 1) {
      // TODO Throw invalid address exception
      // TODO Handle case where setting RAM inside the program segment boundary
    }
    if (value < -32768 || value > 65535) {
      // TODO Throw (warn?) overflow exception
    }
    ram[address] = value;
  }
  
  function getProgramCounter() {
    return pc;
  }
  
  function setProgramCounter(target) {
    if (target < 0 || target >= boundary) {
      // TODO Throw invalid jump target error
    }
    pc = target;
  }
  
  function getMachineState() {
    return state;
  }
  
  function setMachineState(newState) {
    state = newState;
    // TODO Emit events
  }
  
  function loadInstructions(instructions) {
    for(var i = 0; i < instructions.length; ++i) {
      ram[i] = instructions[i];
    }
    boundary = instructions.length;
    setMachineState(states.READY);
  }
  
  function getInstructionAtAddress(address) {
    if (getMachineState() === states.EMPTY) {
      // TODO emit error
    }
    if (address <= 0 || address >= boundary) {
      // TODO Emit Out of Bounds Error
    }
    return ram[address];
  }
  
  function decodeBinaryInstruction(binaryInstruction) {
    var encoded = binaryInstruction;
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
  
  function fetchInstruction() {
    ir = getInstructionAtAddress(pc);
    inst = null;
  }
  
  function decodeInstruction() {
    inst = decodeBinaryInstruction(ir);
  }
  
  function executeInstruction() {
    // Bump the instruction number
    setProgramCounter(getProgramCounter() + 1);
    
    // Get the operation
    var op   = inst.operation;
    var args = inst.args; 
    
    // Unpack Arguments
    var rx, ry, rz, n;
    var signature = hmmm.signatures[op];
    
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
    if (op === "halt") {
      setMachineState(states.HALTED);
    }
    else if (op === "read") {
      // TODO Find synchronous method of getting user input
      setRegister(rx, 5);
    }
    else if (op === "write") {
      var data = getRegister(rx);
      console.log(data); // TODO Determine the best mechanism for output (stream interface?)
    }
    else if (op === "jumpr") {
      var data = getRegister(rx);
      setProgramCounter(data);
    }
    else if (op === "setn") {
      setRegister(rx, n);
    }
    else if (op === "loadn") {
      var data = getRam(n);
      setRegister(rx, data);
    }
    else if (op === "storen") {
      var data = getRegister(rx);
      setRam(n, data);
    }
    else if (op === "loadr") {
      var address = getRegister(ry);
      var data = getRam(address);
      setRegister(rx, data);
    }
    else if (op === "storer") {
      var data = getRegister(rx);
      var address = getRegister(ry);
      setRam(address, data);
    }
    else if (op === "addn") {
      var data = getRegister(rx);
      setRegister(rx, data + n);
    }
    else if (op === "nop") {
      // Do nothing
    }
    else if (op === "copy") {
      var data = getRegister(ry);
      setRegister(rx, data);
    }
    else if (op === "add") {
      var data1 = getRegister(ry);
      var data2 = getRegister(rz);
      setRegister(rx, data1 + data2);
    }
    else if (op === "neg") {
      var data = getRegister(ry);
      setRegister(rx, -data);
    }
    else if (op === "sub") {
      var data1 = getRegister(ry);
      var data2 = getRegister(rz);
      setRegister(rx, data1 - data2);
    }
    else if (op === "mul") {
      var data1 = getRegister(ry);
      var data2 = getRegister(rz);
      setRegister(rx, data1 * data2);
    }
    else if (op === "div") {
      var data1 = getRegister(ry);
      var data2 = getRegister(rz);
      setRegister(rx, parseInt(data1 / data2));
    }
    else if (op === "mod") {
      var data1 = getRegister(ry);
      var data2 = getRegister(rz);
      setRegister(rx, data1 % data2);
    }
    else if (op === "jumpn") {
      setProgramCounter(n);
    }
    else if (op === "calln") {
      var nextInst = getProgramCounter(); // We've already bumped at this point
      setRegister(rx, nextInst);
      setProgramCounter(n);
    }
    else if (op === "jeqzn") {
      var data = getRegister(rx);
      if (data === 0) {
        setProgramCounter(n);
      }
    }
    else if (op === "jnezn") {
      var data = getRegister(rx);
      if (data !== 0) {
        setProgramCounter(n);
      }
    }
    else if (op === "jgtzn") {
      var data = getRegister(rx);
      if (data > 0) {
        setProgramCounter(n);
      }
    }
    else if (op === "jltzn") {
      var data = getRegister(rx);
      if (data < 0) {
        setProgramCounter(n);
      }
    }
    else {
      // TODO BIG ERROR
    }
    
  }
  
  function next() {
    fetchInstruction();
    decodeInstruction();
    executeInstruction();
  }
  
  function run() {
    setMachineState(states.RUNNING);
    while (getMachineState() == states.RUNNING) {
      next();
    }
  }
  
  function runNextInstruction() {
    setMachineState(states.RUNNING);
    next();
    setMachineState(states.PAUSED);
  }
  
  // Public Interface
  this.loadProgram = function(binary) {
    var codeArray = [];
    binary.split("\n").forEach(function(line) {
      if (line.trim() === "") {
        return;
      }
      codeArray.push(parseInt(line.replace(/ /g, ""), 2));
    });
    resetMachine();
    loadInstructions(codeArray);
  };

  this.run = function() {
    run();
  };

  this.stepForward = function() {
    runNextInstruction();
  };
  
  this.dumpRam = function() {
    return ram.slice(0); // Shallow Copy
  };
  
  this.dumpCurrentInstruction = function() {
    return inst.toString();
  };
  
  this.dumpAllInstructions = function() {
    var dumped = [];
    for (var i = 0; i < boundary; ++i) {
      var binInst = getInstructionAtAddress[i];
      dumped.push(decodeBinaryInstruction(binInst));
    }
    return dumped;
  };
  
  this.padZeroesLeft = function(string, width) {
    var pad = "";
    for (var i = 0; i < width; ++i) {
      pad += "0";
    }
    return pad.substring(0, pad.length - string.length) + string;
  };
  
  this.spaceIntoNibbles = function(bitstring) {
    var spaced = "";
    for (var i = 0; i < bitstring.length; ++i) {
      if (i % 4 === 0 && i !== 0) {
        spaced += " ";
      }
      spaced += bitstring[i];
    }
    return spaced;
  };
  
  this.dumpProgram = function() {
    var bins = [];
    for (var i = 0; i < boundary; ++i) {
      var bin = ram[i].toString(2);
      bins.push(this.spaceIntoNibbles(this.padZeroesLeft(bin, 16)));
    }
    return bins
  }

  resetMachine();
  
  if (binary) {
    this.loadProgram(binary);
  };

};

util.inherits(HmmmSimulator, events.EventEmitter);

module.exports = exports = HmmmSimulator;
