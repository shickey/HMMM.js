ace.define("ace/mode/hmmm_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function(require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

  var HmmmHighlightRules = function() {

    this.$rules = { 
      start: [ 
        { token: 'keyword.control.assembly',
        regex: '\\b(?:halt|read|write|jumpr|setn|loadn|storen|loadr|storer|addn|add|copy|nop|sub|neg|mul|div|mod|jumpn|calln|jeqzn|jgtzn|jltzn|jnezn|mov|jump|jeqz|jnez|jgtz|jltz|call|loadi|load|storei|store)\\b',
        caseInsensitive: false },
        { token: 'variable.parameter.register.assembly',
        regex: '\\b(?:r\\d|r1[0-5])\\b',
        caseInsensitive: true },
        { token: 'constant.character.instructionNumber',
        regex: '^\\s*[0-9]+\\b' },
        { token: 'constant.character.decimal.assembly',
        regex: '\\b[0-9]+\\b' },
        { token: 'constant.character.hexadecimal.assembly',
        regex: '\\b0x[A-F0-9]+\\b',
        caseInsensitive: true },
        { token: 'comment.assembly', regex: '#.*$' } 
      ] 
    }
    
    this.normalizeRules();
  };

  HmmmHighlightRules.metaData = { 
    fileTypes: [ 'hmmm' ],
    name: 'HMMM',
    scopeName: 'source.assembly.hmmm'
  }


  oop.inherits(HmmmHighlightRules, TextHighlightRules);

  exports.HmmmHighlightRules = HmmmHighlightRules;
});

ace.define("ace/mode/hmmm",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/hmmm_highlight_rules"], function(require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var TextMode = require("./text").Mode;
  var HmmmHighlightRules = require("./hmmm_highlight_rules").HmmmHighlightRules;

  var Mode = function() {
    this.HighlightRules = HmmmHighlightRules;
  };
  oop.inherits(Mode, TextMode);

  (function() {
    this.lineCommentStart = "#";
    this.$id = "ace/mode/hmmm";
  }).call(Mode.prototype);

  exports.Mode = Mode;
});
