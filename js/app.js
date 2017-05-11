var app = angular.module('hmmmApp', ['ngRoute', 'ngAnimate', 'ui.utils']);

app.run(function($rootScope, $location) {
  
  $rootScope.go = function(path, animationClass) {
    $rootScope.animationClass = animationClass;
    $location.path(path);
  }
  
  $rootScope.$on('$routeChangeSuccess', function() {
    ga('send', 'pageview', $location.path());
  });

  $rootScope.range = function(num) {
    var r = []
    for (var i = 0; i < num; ++i) {
      r.push(i);
    }
    return r;
  }
  
});

app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'templates/editor.html',
      controller: 'EditorCtrl'
    })
    .when('/simulate', {
      templateUrl: 'templates/simulator.html',
      controller: 'SimulatorCtrl'
    })
    .when('/about', {
      templateUrl: 'templates/about.html'
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
  
  return function(input) {
    return hmmm.util.spaceIntoNibbles(hmmm.util.binaryForInteger(input, 16));
  };

});

app.filter('byte', function() {

  return function(input) {
    var bin = parseInt(hmmm.util.binaryForInteger(input, 16), 2);
    return hmmm.util.padZeroesLeft(bin.toString(16).toUpperCase(), 2);
  };

});

app.filter('word', function() {

  return function(input) {
    var bin = parseInt(hmmm.util.binaryForInteger(input, 16), 2)
    return hmmm.util.padZeroesLeft(bin.toString(16).toUpperCase(), 4);
  };

});

app.filter('instruction', ['HmmmSim', function(HmmmSim) {
  return function(input) {
    return hmmm.util.instructionFromBinary(input) || "[Invalid instruction]";
  }
}]);

app.controller('EditorCtrl', ['$scope', 'HmmmSim', function($scope, HmmmSim) {
  
  var hmmmEditor = ace.edit("hmmm-editor");
  hmmmEditor.getSession().setMode("ace/mode/hmmm");
  hmmmEditor.setTheme("ace/theme/monokai");
  hmmmEditor.setHighlightActiveLine(false);
  hmmmEditor.setShowPrintMargin(false);
  hmmmEditor.setValue(HmmmSim.getHmmmCode());
  hmmmEditor.clearSelection();

  var binEditor = ace.edit("bin-editor");
  binEditor.setTheme("ace/theme/monokai");
  binEditor.setReadOnly(true);
  binEditor.setHighlightActiveLine(false);
  binEditor.setShowPrintMargin(false);
  binEditor.setValue(HmmmSim.getBinary());
  binEditor.clearSelection();
  
  var assembler = hmmm.assembler;
  
  var Range = ace.require("ace/range").Range;
  
  var errorMarkerIds = [];
  
  $scope.showInstructions = HmmmSim.getShowInstructions();
  
  if (HmmmSim.getBinary()) {
    $scope.enableSimulation = true;
  }
  else {
    $scope.enableSimulation = false;
  }

  $scope.examples = examples; // Global loaded from hmmm_examples.js

  $scope.selectExample = function(index) {
    HmmmSim.setHmmmCode(examples[index].code);
    hmmmEditor.clearSelection();
  }
  
  
  $scope.assemble = function() {

    var session = hmmmEditor.session;
    session.clearAnnotations();
    errorMarkerIds.forEach(function(markerId) {
      session.removeMarker(markerId);
    });
    errorMarkerIds = [];
    
    var output = assembler.assemble(hmmmEditor.getValue());
    if (output.errors !== undefined) {
      
      $scope.enableSimulation = false;
      
      session.setAnnotations(output.errors.map(function(e){
        var markerRange = new Range(e.range.start.row - 1, e.range.start.column - 1, e.range.end.row - 1, e.range.end.column - 1);
        var markerId = session.addMarker(markerRange, "hmmm-error", "text");
        errorMarkerIds.push(markerId);
        return {
          row: e.range.start.row - 1,
          column: e.range.start.column,
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
      binEditor.clearSelection();
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
      hmmmEditor.clearSelection();
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

  $('[data-toggle="tooltip"]').tooltip({
    container: 'body'
  });
  
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
  
  var outAndErrHandler = function(data) {
    hmmmConsole.navigateFileEnd();
    hmmmConsole.insert(data + "\n");
  }
  
  var simulator = hmmm.simulator.createSimulator(null, outAndErrHandler, outAndErrHandler);
  $scope.simulator = simulator;
  $scope.simulatorModes = [
    hmmm.simulator.simulatorModes.SAFE,
    hmmm.simulator.simulatorModes.WARN,
    hmmm.simulator.simulatorModes.UNSAFE
  ];

  $scope.displayStringForMode = function(mode) {
    if (mode === hmmm.simulator.simulatorModes.SAFE) {
      return "Safe Mode"
    }
    else if (mode === hmmm.simulator.simulatorModes.WARN) {
      return "Warn Mode"
    }
    else if (mode === hmmm.simulator.simulatorModes.UNSAFE) {
      return "Unsafe Mode!"
    }
  }

  var binary = HmmmSim.getBinary();
  if (!binary) {
    $location.path("/")
  }
  else {
    simulator.loadBinary(HmmmSim.getBinary());
  }
  
  $scope.running = false;
  $scope.currentTimeout = undefined;

  var execute = function() {
    if (simulator.state !== hmmm.simulator.simulatorStates.ERROR && simulator.state !== hmmm.simulator.simulatorStates.HALT && simulator.state !== hmmm.simulator.simulatorStates.WAIT) {
      simulator.runNextInstruction();
      if (simulator.state === hmmm.simulator.simulatorStates.WAIT) {
        $scope.waitingForInput = true;
        $scope.currentTimeout = undefined;
        return;
      }
      $scope.currentTimeout = $timeout(execute, $scope.timingDelay);
    }
    else {
      if (simulator.state === hmmm.simulator.simulatorStates.ERROR || simulator.state === hmmm.simulator.simulatorStates.HALT) {
        $scope.running = false;
      }
      $scope.currentTimeout = undefined;
    }
  }

  // Input Handling

  $scope.waitingForInput = false;
  $scope.inputValue = undefined;
  $scope.invalidInputInteger = false;

  $scope.readInput = function(input) {
    if (simulator.readInput(input)) {
      $scope.waitingForInput = false;
      $scope.inputValue = undefined;
      $scope.invalidInputInteger = false;
      if ($scope.running === true) {
        $timeout(execute, $scope.timingDelay);
      }
    }
    else {
      $scope.invalidInputInteger = true;
    }
  }

  $scope.cancelInput = function() {
    $scope.waitingForInput = false;
    $scope.inputValue = undefined;
    $scope.invalidInputInteger = false;
    $scope.running = false;
    simulator.stepBackward();
  }

  $scope.$watch('waitingForInput', function(newVal, oldVal) {
    if (newVal === true) {
      $('#input-modal').modal({
        backdrop: 'static',
        keyboard: false
      });
      $('#hmmm-input').focus();
    }
    else {
      $('#input-modal').modal('hide');
    }
  });
  
  $scope.runProgram = function() {
    $scope.running = true;
    execute();
  }
  
  $scope.pauseExecution = function() {
    if ($scope.currentTimeout) {
      $timeout.cancel($scope.currentTimeout);
      $scope.currentTimeout = undefined;
      $scope.running = false;
    }
  }
  
  $scope.reset = function() {
    simulator.resetMachine();
    simulator.loadBinary(HmmmSim.getBinary());
    hmmmConsole.setValue("");
    $scope.running = false;
  }
  
  $scope.stepForward = function() {
    simulator.runNextInstruction();
    if (simulator.state === hmmm.simulator.simulatorStates.WAIT) {
      $scope.waitingForInput = true;
      $scope.currentTimeout = undefined;
    }
  }
  
  $scope.stepBack = function() {
    simulator.stepBackward();
  }

  $scope.selectedRamIndex = -1;

  $scope.selectRam = function(index) {
    $scope.selectedRamIndex = index;
  }

  $scope.ramViews = {
    GRID: "GRID",
    LIST: "LIST"
  };

  $scope.ramView = $scope.ramViews.GRID;

  $scope.changeRamView = function(viewType) {
    $scope.ramView = viewType;
  };
  
}]);