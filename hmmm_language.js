var hmmm = exports = module.exports = {

  // Maps all instruction aliases to their respective
  // standardized HMMM instruction name
  instructions :
    {"halt":"halt", "read":"read", "write":"write", "nop":"nop",
     "setn":"loadn", "addn":"addn", "mov":"mov", "copy":"mov", "add":"add",
     "sub":"sub", "neg":"neg", "mul":"mul", "div":"div",
     "mod":"mod", "jumpn":"jump", "jeqz":"jeqz", "jeqzn":"jeqz",
     "jnez":"jnez", "jnezn":"jnez", "jgtz":"jgtz", "jgtzn":"jgtz",
     "jltz":"jltz", "jltzn":"jltz", "call":"call", "calln":"call",
     "jump":"jumpi", "jumpr":"jumpi", "loadn":"load", "storen":"store",
     "load":"loadi", "loadi":"loadi", "loadr":"loadi",
     "store":"storei", "storei":"storei", "storer":"storei"},

  // Argument signatures for each instruction
  // r : Register
  // s : Signed 8-bit Integer
  // u : Unsigned 8-bit Integer
  // z : 4-bit Padding (0000)
  // n : 16-bit Integer (Signed or Unsigned)
  signatures : {
    "halt"  : "",
    "read"  : "r",
    "write" : "r",
    "jumpi" : "r",
    "loadn" : "rs",
    "load"  : "ru",
    "store" : "ru",
    "loadi" : "rr",
    "storei": "rr",
    "addn"  : "rs",
    "add"   : "rrr",
    "mov"   : "rr",
    "nop"   : "",
    "sub"   : "rrr",
    "neg"   : "rzr",
    "mul"   : "rrr",
    "div"   : "rrr",
    "mod"   : "rrr",
    "jump"  : "zu",
    "call"  : "ru",
    "jeqz"  : "ru",
    "jgtz"  : "ru",
    "jltz"  : "ru",
    "jnez"  : "ru",
    "data"  : "n"
  },

  opcodes : {
        "halt"   : { opcode : "0000000000000000", mask : "1111111111111111" },
        "read"   : { opcode : "0000000000000001", mask : "1111000011111111" },
        "write"  : { opcode : "0000000000000010", mask : "1111000011111111" },
        "jumpi"  : { opcode : "0000000000000011", mask : "1111000011111111" },
        "loadn"  : { opcode : "0001000000000000", mask : "1111000000000000" },
        "load"   : { opcode : "0010000000000000", mask : "1111000000000000" },
        "store"  : { opcode : "0011000000000000", mask : "1111000000000000" },
        "loadi"  : { opcode : "0100000000000000", mask : "1111000000001111" },
        "storei" : { opcode : "0100000000000001", mask : "1111000000001111" },
        "addn"   : { opcode : "0101000000000000", mask : "1111000000000000" },
        "nop"    : { opcode : "0110000000000000", mask : "1111111111111111" },
        "mov"    : { opcode : "0110000000000000", mask : "1111000000001111" },
        "add"    : { opcode : "0110000000000000", mask : "1111000000000000" },
        "neg"    : { opcode : "0111000000000000", mask : "1111000011110000" },
        "sub"    : { opcode : "0111000000000000", mask : "1111000000000000" },
        "mul"    : { opcode : "1000000000000000", mask : "1111000000000000" },
        "div"    : { opcode : "1001000000000000", mask : "1111000000000000" },
        "mod"    : { opcode : "1010000000000000", mask : "1111000000000000" },
        "jump"   : { opcode : "1011000000000000", mask : "1111111100000000" },
        "call"   : { opcode : "1011000000000000", mask : "1111000000000000" },
        "jeqz"   : { opcode : "1100000000000000", mask : "1111000000000000" },
        "jnez"   : { opcode : "1101000000000000", mask : "1111000000000000" },
        "jgtz"   : { opcode : "1110000000000000", mask : "1111000000000000" },
        "jltz"   : { opcode : "1111000000000000", mask : "1111000000000000" },
        "data"   : { opcode : "0000000000000000", mask : "0000000000000000" }
  },
  
  opcodePrecedence : 
    ["halt","read","write","jumpi","loadn","load","store","loadi","storei",
     "addn","nop","mov","add","neg","sub","mul","div","mod","jump","call",
     "jeqz","jnez","jgtz","jltz","data"]

}
