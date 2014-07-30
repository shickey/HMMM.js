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
      expect(error.lineNumber).to.equal(0);
      expect(error.type).to.have.string('INSTRUCTION NUMBER');
      done();
    });
  });
  
  it('should return an error when an instruction has the wrong instruction number', function(done) {
    assembleFile('bad_inst_number.hmmm', function(binary, error) {
      expect(error).to.be.defined;
      expect(error.lineNumber).to.equal(2);
      expect(error.type).to.have.string('INSTRUCTION NUMBER');
      done();
    });
  });
  
  it('should return an error when an invalid instruction is given', function(done) {
    assembleFile('bad_inst.hmmm', function(binary, error) {
      expect(error).to.be.defined;
      expect(error.lineNumber).to.equal(1);
      expect(error.type).to.have.string('INSTRUCTION ERROR');
      done();
    });
  });
  
  it('should return an error when an operation is given the wrong number of arguments');
  it('should return an error when an operation is given the wrong type of argument');
  it('should return an error when an invalid register is accessed');
  it('should return an error when an invalid RAM address is accessed');
  it('should return an error when a numerical number is out of bounds');
  
});
