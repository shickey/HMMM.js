var hmmm = require('./hmmm_language');
var fs   = require('fs');

exports = module.exports = (function() {
  
  'use strict';
  
  var machine = this;
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
  
  function resetMachine() {
    state     = states.EMPTY; // State of machine (starts with no program loaded)
    boundary  = 0;            // Index of the first free memory slot (after the program data)
    pc        = 0;            // Program Counter
    ir        = null;         // Instruction Register (hold binary data)
    inst      = null;         // Decoded Instruction
    registers = [];           // General Purpose Registers r0-r15
    ram       = [];           // Memory
    
    // Instantiate Registers
    for (var i = 0; i < NUM_REGISTERS; ++i) {
      registers.push(0);
    }
    
    // Instantiate Memory
    for (var j = 0 ; j < RAM_SIZE; ++j) {
      ram.push(0);
    }
  }
  
  // Only interact with registers via these getters and setters
  // This will guarantee that r0 is always 0
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
    }
    return ram[address];
  }
  
  function setRam(address, value) {
    if (address < 0 || address > RAM_SIZE - 1) {
      // TODO Throw invalid address exception
    }
    if (value < -32768 || value > 65535) {
      // TODO Throw (warn?) overflow exception
    }
    ram[address] = value;
  }
  
  function loadInstructions(instructions) {
    for(var i = 0; i < instructions.length; ++i) {
      ram[i] = instructions[i];
    }
    boundary = instructions.length;
    state = states.READY;
  }
  
  function fetchInstruction() {
    if (!state == states.EMPTY) {
      // TODO throw
    }
    if (pc >= boundary) {
      // TODO Throw Memory out of bounds error
    }
    ir = ram[pc];
    inst = null;
  }
  
  function decodeInstruction() {
    var encoded = ir;
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
      // TODO Throw, we could decode the operation
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
    inst = decoded;
  }
  
  function executeInstruction() {
    pc += 1;
    
    // Get the operation
    var op   = inst.operation;
    var args = inst.args; 
    
    if (op === "halt") {
      state = states.HALTED;
    }
    else if (op === "read") {
      // TODO Find synchronous method of getting user input
    }
    else if (op === "write") {
      var rx = +(args[0].slice(1));
      var val = getRegister(rx);
      console.log(val); // TODO Determine the best mechanism for output (stream interface?)
    }
    else if (op === "jumpr") {
      var rx = +(args[0].slice(1));
      var val = getRegister(rx);
      if (val < 0 || val >= boundary) {
        // TODO Throw invalid jump target
      }
      pc = val;
    }
    
  }
  
  function next() {
    fetchInstruction();
    decodeInstruction();
    executeInstruction();
  }
  
  function run() {
    state = states.RUNNING;
    while (state === states.RUNNING) {
      next();
    }
  }
  
  function runNextInstruction() {
    state = states.RUNNING;
    next();
    state = states.PAUSED;
  }
  
  resetMachine();
  
  return {

    loadProgram : function(binaryFilename) {
      var machineCode = fs.readFileSync(binaryFilename).toString();
      var codeArray = [];
      machineCode.split("\n").forEach(function(line) {
        if (line.trim() === "") {
          return;
        }
        codeArray.push(parseInt(line.replace(/ /g, ""), 2));
      });
      resetMachine();
      loadInstructions(codeArray);
    },

    run : function() {
      run();
    },

    runNextInstruction : function() {
      runNextInstruction();
    },
    
    dumpRam : function() {
      console.log(ram);
    },
    
    dumpInstruction : function() {
      console.log(inst);
    },
    
    dumpAllInstructions : function() {
      // TODO This won't dump correctly if pc !== 0
      while (pc < boundary) {
        this.runNextInstruction();
        console.log(inst);
      }
    },
    
    dumpAll : function() {
      console.log(program   );
      console.log(boundary  );
      console.log(pc        );
      console.log(ir        );
      console.log(inst      );
      console.log(registers );
      console.log(ram       );
    },
    
    padZeroesLeft : function(string, width) {
      var pad = "";
      for (var i = 0; i < width; ++i) {
        pad += "0";
      }
      return pad.substring(0, pad.length - string.length) + string;
    },
    
    spaceIntoNibbles : function(bitstring) {
      var spaced = "";
      for (var i = 0; i < bitstring.length; ++i) {
        if (i % 4 === 0 && i !== 0) {
          spaced += " ";
        }
        spaced += bitstring[i];
      }
      return spaced;
    },
    
    dumpProgram : function() {
      for (var i = 0; i < boundary; ++i) {
        var bin = ram[i].toString(2);
        console.log('Instruction ' + i + ' : ' + this.spaceIntoNibbles(this.padZeroesLeft(bin, 16)));
      }
    }

  }

}());
