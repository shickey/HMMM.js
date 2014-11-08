var expect        = require('chai').expect
var fs            = require('fs')
var HmmmAssembler = require('../hmmm-assembler')
var HmmmSimulator = require('../hmmm-simulator')

describe('HmmmSimulator', function() {
  
  this.timeout(500);
  
  var assembler = new HmmmAssembler();
  var simulator;
  
  beforeEach(function() {
    simulator = new HmmmSimulator();
  });
  
  it('understands `halt`', function() {
    var bin = assembler.assemble("0 halt");
    simulator.loadBinary(bin.binary);
    expect(simulator.state).to.equal(simulator.states.READY);
    simulator.run();
    expect(simulator.state).to.equal(simulator.states.HALT);
    expect(simulator.pc).to.equal(0);
  });
  
  it('understands `read`', function() {
    var inHandler = function() {
      return 5;
    }
    simulator.inHandler = inHandler;
    var bin = assembler.assemble("0 read r1\n1 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.registers[1]).to.equal(5);
  });

  it('understands `write`', function() {
    var outVar;
    var inHandler = function() {
      return 9;
    }
    var outHandler = function(data) {
      outVar = data;
    };
    simulator.inHandler = inHandler;
    simulator.outHandler = outHandler;
    var bin = assembler.assemble("0 read r1\n1 write r1\n2 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(outVar).to.equal(9);
  });

  it('understands `nop`', function() {
    function arrayEquals(array1, array2) {
      if (array1.length !== array2.length) {
        return false;
      }
      for (var i = 0; i < array1.length; ++i) {
        if (array1[i] !== array2[i]) {
          return false;
        }
      }
      return true;
    };
    var bin = assembler.assemble("0 nop\n1 halt");
    simulator.loadBinary(bin.binary);
    var clonedRegisters = simulator.registers.slice(0);
    var clonedRam = simulator.ram.slice(0);
    simulator.run();
    expect(simulator.state).to.equal(simulator.states.HALT);
    expect(simulator.pc).to.equal(1);
    expect(arrayEquals(clonedRegisters, simulator.registers)).to.be.true;
    expect(arrayEquals(clonedRam, simulator.ram)).to.be.true;
  });

  it('understands `setn`', function() {
    var bin = assembler.assemble("0 setn r1 5\n1 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.registers[1]).to.equal(5);
  });

  it('understands `addn`', function() {
    var bin = assembler.assemble("0 addn r1 5\n1 addn r1 5\n2 halt");
    simulator.loadBinary(bin.binary);
    simulator.runNextInstruction();
    expect(simulator.registers[1]).to.equal(5);
    simulator.runNextInstruction();
    expect(simulator.registers[1]).to.equal(10);
  });

  it('understands `copy`', function() {
    var bin = assembler.assemble("0 setn r1 5\n1 copy r2 r1\n2 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.registers[1]).to.equal(5);
    expect(simulator.registers[2]).to.equal(5);
  });

  it('understands `add`', function() {
    var bin = assembler.assemble("0 setn r1 5\n1 setn r2 3\n2 add r3 r1 r2\n3 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.registers[3]).to.equal(8);
  });

  it('understands `sub`', function() {
    var bin = assembler.assemble("0 setn r1 5\n1 setn r2 3\n2 sub r3 r1 r2\n3 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.registers[3]).to.equal(2);
  });

  it('understands `neg`', function() {
    var bin = assembler.assemble("0 setn r1 5\n1 neg r2 r1\n2 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.registers[2]).to.equal(-5);
  });

  it('understands `mul`', function() {
    var bin = assembler.assemble("0 setn r1 5\n1 setn r2 3\n2 mul r3 r1 r2\n3 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.registers[3]).to.equal(15);
  });

  it('understands `div`', function() {
    var bin = assembler.assemble("0 setn r1 7\n1 setn r2 3\n2 div r3 r1 r2\n3 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.registers[3]).to.equal(2);
  });

  it('understands `mod`', function() {
    var bin = assembler.assemble("0 setn r1 7\n1 setn r2 3\n2 mod r3 r1 r2\n3 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.registers[3]).to.equal(1);
  });

  it('understands `jumpn`', function() {
    var bin = assembler.assemble("0 jumpn 4\n1 nop\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(bin.binary);
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(4);
  });

  it('understands `jumpr`', function() {
    var bin = assembler.assemble("0 setn r1 4\n1 jumpr r1\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(bin.binary);
    simulator.runNextInstruction();
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(4);
  });

  it('understands `jeqzn`', function() {
    var jumpBin = assembler.assemble("0 setn r1 0\n1 jeqzn r1 4\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(jumpBin.binary);
    simulator.runNextInstruction();
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(4);
    
    simulator = new HmmmSimulator();
    var noJumpBin = assembler.assemble("0 setn r1 5\n1 jeqzn r1 4\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(noJumpBin.binary);
    simulator.runNextInstruction();
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(2);
  });

  it('understands `jnezn`', function() {
    var jumpBin = assembler.assemble("0 setn r1 5\n1 jnezn r1 4\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(jumpBin.binary);
    simulator.runNextInstruction();
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(4);
    
    simulator = new HmmmSimulator();
    var noJumpBin = assembler.assemble("0 setn r1 0\n1 jnezn r1 4\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(noJumpBin.binary);
    simulator.runNextInstruction();
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(2);
  });

  it('understands `jgtzn`', function() {
    var jumpBin = assembler.assemble("0 setn r1 5\n1 jgtzn r1 4\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(jumpBin.binary);
    simulator.runNextInstruction();
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(4);
    
    simulator = new HmmmSimulator();
    var zeroBin = assembler.assemble("0 setn r1 0\n1 jgtzn r1 4\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(zeroBin.binary);
    simulator.runNextInstruction();
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(2);
    
    simulator = new HmmmSimulator();
    var negBin = assembler.assemble("0 setn r1 -3\n1 jgtzn r1 4\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(negBin.binary);
    simulator.runNextInstruction();
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(2);
  });

  it('understands `jltzn`', function() {
    var jumpBin = assembler.assemble("0 setn r1 -3\n1 jltzn r1 4\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(jumpBin.binary);
    simulator.runNextInstruction();
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(4);
    
    simulator = new HmmmSimulator();
    var zeroBin = assembler.assemble("0 setn r1 0\n1 jltzn r1 4\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(zeroBin.binary);
    simulator.runNextInstruction();
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(2);
    
    simulator = new HmmmSimulator();
    var posBin = assembler.assemble("0 setn r1 5\n1 jltzn r1 4\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(posBin.binary);
    simulator.runNextInstruction();
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(2);
  });

  it('understands `calln`', function() {
    var bin = assembler.assemble("0 calln r14 4\n1 nop\n2 nop\n3 nop\n4 nop\n5 halt");
    simulator.loadBinary(bin.binary);
    simulator.runNextInstruction();
    expect(simulator.pc).to.equal(4);
    expect(simulator.registers[14]).to.equal(1);
  });

  it('understands `storen`', function() {
    var bin = assembler.assemble("0 setn r1 5\n1 storen r1 255\n2 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.ram[255]).to.equal(5);
  });
  
  it('understands `loadn`', function() {
    var bin = assembler.assemble("0 setn r1 5\n1 storen r1 255\n2 loadn r2 255\n3 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.registers[2]).to.equal(5);
  });

  it('understands `storer`', function() {
    var bin = assembler.assemble("0 setn r1 5\n1 setn r2 127\n2 storer r1 r2\n3 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.ram[127]).to.equal(5);
  });
  
  it('understands `loadr`', function() {
    var bin = assembler.assemble("0 setn r1 5\n1 storen r1 127\n2 setn r2 127\n3 load r3 r2\n4 halt");
    simulator.loadBinary(bin.binary);
    simulator.run();
    expect(simulator.registers[3]).to.equal(5);
  });

});