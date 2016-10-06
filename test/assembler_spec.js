var expect = require('chai').expect;
var fs     = require('fs');
var hmmm   = require('../hmmm.js');

describe('HmmmAssembler', function() {
  
  this.timeout(500);
  
  var assembler = hmmm.assembler;
  
  function readTestFile(filename) {
    var filepath = 'test/test_files/';
    filepath += filename;
    return fs.readFileSync(filepath).toString();
  }
  
  function assembleFile(filename) {
    var source = readTestFile(filename);
    return assembler.assemble(source);
  }
  
  it('should return the correct HMMM binary for a valid HMMM source', function() {
    var validBinary = readTestFile('valid.out')
    var assembled = assembleFile('valid.hmmm')
    expect(assembled.binary).to.equal(validBinary);
    expect(assembled.errors).to.be.undefined;
  });
  
  it('should return an error when syntax is invalid', function() {
    var assembled = assembleFile('syntax_error.hmmm');
    expect(assembled.errors.length).to.be.above(0)
    var error = assembled.errors[0];
    expect(error.message).to.have.string('instruction number');
  });
  
  it('should return an error when an instruction has the wrong instruction number', function() {
    var assembled = assembleFile('bad_inst_number.hmmm');
    expect(assembled.errors.length).to.be.above(0)
    var error = assembled.errors[0];
    expect(error.message).to.have.string('instruction number');
  });
  
  it('should return an error when an invalid instruction is given', function() {
    var assembled = assembleFile('bad_inst.hmmm');
    expect(assembled.errors.length).to.be.above(0)
    var error = assembled.errors[0];
    expect(error.message).to.have.string('instruction');
  });
  
  it('should return an error when an operation is given the wrong number of arguments', function() {
    var assembled = assembleFile('wrong_num_args.hmmm');
    expect(assembled.errors.length).to.be.above(0)
    var error = assembled.errors[0];
    expect(error.message).to.have.string('many arguments');
  });
  
  it('should return an error when an operation is given the wrong type of argument (expecting register)', function() {
    var assembled = assembleFile('wrong_arg_type_reg.hmmm');
    expect(assembled.errors.length).to.be.above(0)
    var error = assembled.errors[0];
    expect(error.message).to.have.string('Expected a register');
  });
  
  it('should return an error when an operation is given the wrong type of argument (expecting unsigned)', function() {
    var assembled = assembleFile('wrong_arg_type_unsigned.hmmm');
    expect(assembled.errors.length).to.be.above(0)
    var error = assembled.errors[0];
    expect(error.message).to.have.string('Expected an unsigned integer');
  });
  
  it('should return an error when an operation is given the wrong type of argument (expecting signed)', function() {
    var assembled = assembleFile('wrong_arg_type_signed.hmmm');
    expect(assembled.errors.length).to.be.above(0)
    var error = assembled.errors[0];
    expect(error.message).to.have.string('Expected a signed integer');
  });
  
  it('should allow commas as token delimiters, but only for arguments', function() {
    var validCommas = assembler.assemble('0 add r1,r2,r3 #comment');
    expect(validCommas.errors).to.be.undefined;
    expect(validCommas.binary).to.equal("0110 0001 0010 0011\n");
    
    var invalidCommas = assembler.assemble('0,add,r1 r2 r3');
    expect(invalidCommas.errors.length).to.be.above(0);
  })
  
});
