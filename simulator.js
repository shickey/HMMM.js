var hmmm = require('./hmmm_language');
var fs   = require('fs');

exports = module.exports = (function() {
  
  var NUM_REGISTERS = 16;
  var MEM_SIZE      = 256;
  
  var program, pc, ir, registers, memory, programLoaded;
  
  function resetMachine() {
    program   = false;  // Whether or not a program is loaded in memory
    boundary  = 0;      // Index of the first free memory slot (after the program data)
    pc        = 0;      // Program Counter
    ir        = null;   // Instruction Register (hold binary data)
    inst      = null;   // Decoded Instruction
    registers = [];     // General Purpose Registers r0-r15
    ram       = [];     // 256 * 16 bits of Memory
    
    // Instantiate Registers
    for (var i = 0; i < NUM_REGISTERS; ++i) {
      registers.push(0);
    }
    
    // Instantiate Memory
    for (var j = 0 ; j < MEM_SIZE; ++j) {
      ram.push(0);
    }
  }
  
  function loadInstructions(instructions) {
    for(var i = 0; i < instructions.length; ++i) {
      ram[i] = instructions[i];
    }
    boundary = instructions.length;
    program = true;
  }
  
  function fetchInstruction() {
    if (!program) {
      // throw
    }
    ir = ram[pc];
    inst = null;
  }
  
  function decodeInstruction() {
    var encoded = ir;
    var decoded = {
      inst : null,
      args : []
    };
    
    // Find the correct instruction by iterating over the
    // list of instructions in order of precedence
    hmmm.opcodePrecedence.some(function(possibleInstruction){
      var opcode = parseInt(hmmm.opcodes[possibleInstruction].opcode, 2);
      var mask   = parseInt(hmmm.opcodes[possibleInstruction].mask,   2);
      if ((encoded & mask) === opcode) {
        // We found the right instruction
        decoded.inst = possibleInstruction;
        return true;
      }
    });
    
    if (!decoded.inst) {
      // TODO Throw, we could decode the instruction
    }
    
    // Parse Arguments
    signature = hmmm.signatures[decoded.inst];
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
      while (true) {
        this.runNextInstruction();
      }
    },

    runNextInstruction : function() {
      fetchInstruction();
      decodeInstruction();
      executeInstruction();
    },
    
    dumpRam : function() {
      console.log(ram);
    },
    
    dumpInstruction : function() {
      console.log(inst);
    },
    
    dumpAllInstructions : function() {
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
