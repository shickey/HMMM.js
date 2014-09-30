var app = angular.module('hmmmApp', ['ngRoute', 'ngAnimate']);

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

app.controller('EditorCtrl', ['$scope', '$location', function($scope, $location) {
  
  $scope.hmmmEditor = ace.edit("hmmm-editor");
  $scope.hmmmEditor.setTheme("ace/theme/monokai");
  $scope.hmmmEditor.setHighlightActiveLine(false);
  $scope.hmmmEditor.setShowPrintMargin(false);

  $scope.binEditor = ace.edit("bin-editor");
  $scope.binEditor.setTheme("ace/theme/monokai");
  $scope.binEditor.setReadOnly(true);
  $scope.binEditor.setHighlightActiveLine(false);
  $scope.binEditor.setShowPrintMargin(false);
  
  var assembler = new HmmmAssembler();
  
  var Range = ace.require("ace/range").Range;
  
  var errorMarkerIds = [];
  
  $scope.assemble = function() {
    
    var session = $scope.hmmmEditor.session;
    session.clearAnnotations();
    errorMarkerIds.forEach(function(markerId) {
      session.removeMarker(markerId);
    });
    errorMarkerIds = [];
    
    var output = assembler.assemble($scope.hmmmEditor.getValue());
    if (output.errors.length !== 0) {
      
      session.setAnnotations(output.errors.map(function(e){
        var markerRange = new Range(e.startRow - 1, e.startColumn - 1, e.endRow - 1, e.endColumn);
        var markerId = session.addMarker(markerRange, "hmmm-error", "text");
        errorMarkerIds.push(markerId);
        return {
          row: e.startRow - 1,
          column: e.startColumn,
          text: e.message,
          type: "error"
        }
      }));
      
      $scope.binEditor.setValue("");
    }
    else {
      $scope.binEditor.setValue(output.binary);
    }
  }
  
}]);

app.controller('SimulatorCtrl', ['$scope', '$location', function($scope, $location) {
  var hmmmConsole = ace.edit("hmmm-console");
  hmmmConsole.setTheme("ace/theme/monokai");
  hmmmConsole.setReadOnly(true);
  hmmmConsole.setShowPrintMargin(false);
  hmmmConsole.renderer.setShowGutter(false);
}]);