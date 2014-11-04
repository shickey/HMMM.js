var app = angular.module('hmmmApp', ['ngRoute', 'ngAnimate', 'ui.utils']);

app.run(function($rootScope, $location) {
  
  $rootScope.go = function(path, animationClass) {
    $rootScope.animationClass = animationClass;
    $location.path(path);
  }
  
});

app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'editor.html',
      controller: 'EditorCtrl'
    })
    .when('/simulate', {
      templateUrl: 'simulator.html',
      controller: 'SimulatorCtrl'
    })
    .when('/about', {
      templateUrl: 'about.html'
    })
    .otherwise({
      redirectTo: '/'
    });
});

app.factory('HmmmSim', function() {
  
  var _showInstructions = true;
  var _hmmmCode = undefined;
  var _binary = undefined;
  
  return {
    getShowInstructions: function() {
      return _showInstructions;
    },
    setShowInstructions: function(showInstructions) {
      _showInstructions = showInstructions;
      return _showInstructions;
    },
    getHmmmCode: function() {
      return _hmmmCode;
    },
    setHmmmCode: function(hmmmCode) {
      _hmmmCode = hmmmCode;
      return _hmmmCode;
    },
    getBinary: function() {
      return _binary;
    },
    setBinary: function(binary) {
      _binary = binary;
      return _binary;
    }
  }
  
});

app.filter('binary', function() {
  
  function padZeroesLeft(string, width) {
    var pad = "";
    for (var i = 0; i < width; ++i) {
      pad += "0";
    }
    return pad.substring(0, pad.length - string.length) + string;
  }
  
  function binaryForInteger(integer, width) {
    if (width === undefined) {
      width = 16;
    }
    
    if (integer < 0) {
      // Two's Complement
      var positive = padZeroesLeft(Math.abs(integer).toString(2), width);
      var flipped = flipBitstring(positive);
      var backToNum = parseInt(flipped, 2);
      return padZeroesLeft((backToNum + 1).toString(2), width);
    }

    return padZeroesLeft(parseInt(integer).toString(2), width);
  }

  function flipBitstring(bitstring) {
    var flipped = "";
    for (var i = 0; i < bitstring.length; ++i) {
      if (bitstring[i] == "0") {
        flipped += "1"
      }
      else if (bitstring[i] == "1") {
        flipped += "0"
      }
      else {
        return null;
      }
    }
    return flipped;
  }
  
  function spaceIntoNibbles(bitstring) {
    var spaced = "";
    for (var i = 0; i < bitstring.length; ++i) {
      if (i % 4 === 0 && i !== 0) {
        spaced += " ";
      }
      spaced += bitstring[i];
    }
    return spaced;
  }
  
  return function(input) {
    return spaceIntoNibbles(binaryForInteger(input, 16));
  };
});

app.controller('EditorCtrl', ['$scope', 'HmmmSim', function($scope, HmmmSim) {
  
  var hmmmEditor = ace.edit("hmmm-editor");
  hmmmEditor.setTheme("ace/theme/monokai");
  hmmmEditor.setHighlightActiveLine(false);
  hmmmEditor.setShowPrintMargin(false);
  hmmmEditor.setValue(HmmmSim.getHmmmCode());

  var binEditor = ace.edit("bin-editor");
  binEditor.setTheme("ace/theme/monokai");
  binEditor.setReadOnly(true);
  binEditor.setHighlightActiveLine(false);
  binEditor.setShowPrintMargin(false);
  binEditor.setValue(HmmmSim.getBinary());
  
  var assembler = new HmmmAssembler();
  
  var Range = ace.require("ace/range").Range;
  
  var errorMarkerIds = [];
  
  $scope.showInstructions = HmmmSim.getShowInstructions();
  
  if (HmmmSim.getBinary()) {
    $scope.enableSimulation = true;
  }
  else {
    $scope.enableSimulation = false;
  }
  
  
  $scope.assemble = function() {
    
    var session = hmmmEditor.session;
    session.clearAnnotations();
    errorMarkerIds.forEach(function(markerId) {
      session.removeMarker(markerId);
    });
    errorMarkerIds = [];
    
    var output = assembler.assemble(hmmmEditor.getValue());
    if (output.errors.length !== 0) {
      
      $scope.enableSimulation = false;
      
      session.setAnnotations(output.errors.map(function(e){
        var markerRange = new Range(e.startRow - 1, e.startColumn - 1, e.endRow - 1, e.endColumn - 1);
        var markerId = session.addMarker(markerRange, "hmmm-error", "text");
        errorMarkerIds.push(markerId);
        return {
          row: e.startRow - 1,
          column: e.startColumn,
          text: e.message,
          type: "error"
        }
      }));
      
      HmmmSim.setHmmmCode(undefined);
      HmmmSim.setBinary(undefined);
      
      binEditor.setValue("");
    }
    else {
      binEditor.setValue(output.binary);
      HmmmSim.setHmmmCode(hmmmEditor.getValue());
      HmmmSim.setBinary(output.binary);
      $scope.enableSimulation = true;
    }
  }
  
  $scope.dismissInstructions = function() {
    $scope.showInstructions = false;
    HmmmSim.setShowInstructions(false);
  }
  
  $scope.saveFile = function() {
    if (hmmmEditor.getValue() === '') {
      return;
    }
    var blob = new Blob([hmmmEditor.getValue()], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "source.hmmm");
  }
  
  $scope.loadFile = function() {
    $('#secret-file-select').click();
  }
  
  $scope.fileSelected = function(input) {
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      var text = e.target.result;
      hmmmEditor.setValue(text);
    };
    reader.readAsText(file);
  }
  
}]);

app.controller('SimulatorCtrl', ['$scope', '$location', '$timeout', 'HmmmSim', function($scope, $location, $timeout, HmmmSim) {
  var hmmmConsole = ace.edit("hmmm-console");
  hmmmConsole.setTheme("ace/theme/monokai");
  hmmmConsole.setReadOnly(true);
  hmmmConsole.setShowPrintMargin(false);
  hmmmConsole.renderer.setShowGutter(false);
  
  $scope.timingDelay = 100;
  
  // Allow fluid layout for affixed sidebar elements
  $('[data-clampedwidth]').each(function () {
    var elem = $(this);
    var parentPanel = elem.data('clampedwidth');
    var resizeFn = function () {
        var sideBarNavWidth = $(parentPanel).width() - parseInt(elem.css('paddingLeft')) - parseInt(elem.css('paddingRight')) - parseInt(elem.css('marginLeft')) - parseInt(elem.css('marginRight')) - parseInt(elem.css('borderLeftWidth')) - parseInt(elem.css('borderRightWidth'));
        elem.css('width', sideBarNavWidth);
    };

    resizeFn();
    $(window).resize(resizeFn);
  });
  
  var inHandler = function() {
    return +(prompt("Please input an integer"));
  }
  
  var outAndErrHandler = function(data) {
    hmmmConsole.navigateFileEnd();
    hmmmConsole.insert(data + "\n");
  }
  
  $scope.simulator = new HmmmSimulator(inHandler, outAndErrHandler, outAndErrHandler);
  var simulator = $scope.simulator
  var binary = HmmmSim.getBinary();
  if (!binary) {
    // $location.path("/")
  }
  else {
    simulator.loadBinary(HmmmSim.getBinary());
  }
  
  $scope.runProgram = function() {
    var execute = function() {
      if (simulator.state !== simulator.states.ERROR && simulator.state !== simulator.states.HALT) {
        $timeout(execute, $scope.timingDelay);
        simulator.runNextInstruction();
      }
    }
    execute();
  }
  
  $scope.reset = function() {
    simulator.resetMachine();
    hmmmConsole.setValue("");
  }
  
}]);