var expect    = require('chai').expect;
var fs        = require('fs');
var assembler = require('../assembler.js');

describe('Assembler', function() {
  
  this.timeout(500);
  
  function assembleFile(filename, callback) {
    var filepath = 'test/test_files/';
    filepath += filename;
    var source = fs.readFileSync(filepath).toString();
    assembler.assemble(source, callback);
  }
  
  it('should return a HMMM binary for a valid HMMM source', function(done) {
    var validBinary = fs.readFileSync('test/test_files/valid.out').toString();
    assembleFile('valid.hmmm', function(binary, error) {
      expect(error).to.be.undefined;
      expect(binary).to.equal(validBinary);
      done();
    });
  });
  
  it('should return an error when syntax is invalid', function(done) {
    assembleFile('syntax_error.hmmm', function(binary, error) {
      expect(error).to.be.defined;
      expect(error.lineNumber).to.equal(1);
      expect(error.type).to.have.string('INSTRUCTION NUMBER');
      done();
    });
  });
  
  it('should return an error when an instruction has the wrong instruction number', function(done) {
    assembleFile('bad_inst_number.hmmm', function(binary, error) {
      expect(error).to.be.defined;
      expect(error.lineNumber).to.equal(3);
      expect(error.type).to.have.string('INSTRUCTION NUMBER');
      done();
    });
  });
  
  it('should return an error when an invalid instruction is given', function(done) {
    assembleFile('bad_inst.hmmm', function(binary, error) {
      expect(error).to.be.defined;
      expect(error.lineNumber).to.equal(2);
      expect(error.type).to.have.string('INSTRUCTION ERROR');
      done();
    });
  });
  
  it('should return an error when an operation is given the wrong number of arguments', function(done) {
    assembleFile('wrong_num_args.hmmm', function(binary, error) {
      expect(error).to.be.defined;
      expect(error.lineNumber).to.equal(1);
      expect(error.type).to.have.string('ARGUMENT');
      expect(error.message).to.have.string('Wrong number of arguments');
      done();
    });
  });
  
  it('should return an error when an operation is given the wrong type of argument (expecting register)', function(done) {
    assembleFile('wrong_arg_type_reg.hmmm', function(binary, error) {
      expect(error).to.be.defined;
      expect(error.lineNumber).to.equal(1);
      expect(error.type).to.have.string('ARGUMENT');
      expect(error.message).to.have.string('Wrong argument type');
      expect(error.message).to.have.string('register');
      done();
    });
  });
  
  it('should return an error when an operation is given the wrong type of argument (expecting unsigned)', function(done) {
    assembleFile('wrong_arg_type_unsigned.hmmm', function(binary, error) {
      expect(error).to.be.defined;
      expect(error.lineNumber).to.equal(1);
      expect(error.type).to.have.string('ARGUMENT');
      expect(error.message).to.have.string('Wrong argument type');
      expect(error.message).to.have.string('unsigned');
      done();
    });
  });
  
  it('should return an error when an operation is given the wrong type of argument (expecting signed)', function(done) {
    assembleFile('wrong_arg_type_signed.hmmm', function(binary, error) {
      expect(error).to.be.defined;
      expect(error.lineNumber).to.equal(1);
      expect(error.type).to.have.string('ARGUMENT');
      expect(error.message).to.have.string('Wrong argument type');
      expect(error.message).to.have.string('signed');
      done();
    });
  });
  
  it('should return an error when a numerical number is out of bounds');
  
});
