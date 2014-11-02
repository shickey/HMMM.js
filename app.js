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
  
})

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
  
  $scope.assemble = function() {
    
    var session = hmmmEditor.session;
    session.clearAnnotations();
    errorMarkerIds.forEach(function(markerId) {
      session.removeMarker(markerId);
    });
    errorMarkerIds = [];
    
    var output = assembler.assemble(hmmmEditor.getValue());
    if (output.errors.length !== 0) {
      
      console.log(output.errors);
      
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
    }
  }
  
  $scope.dismissInstructions = function() {
    $scope.showInstructions = false;
    HmmmSim.setShowInstructions(false);
  }
  
}]);

app.controller('SimulatorCtrl', ['$scope', 'HmmmSim', function($scope, HmmmSim) {
  var hmmmConsole = ace.edit("hmmm-console");
  hmmmConsole.setTheme("ace/theme/monokai");
  hmmmConsole.setReadOnly(true);
  hmmmConsole.setShowPrintMargin(false);
  hmmmConsole.renderer.setShowGutter(false);
  
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
  $scope.simulator.loadBinary(HmmmSim.getBinary());
  
  $scope.runProgram = function() {
    $scope.simulator.run(function() {
      $scope.$apply();
    })
  }
  
}]);