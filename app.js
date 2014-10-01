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

app.controller('EditorCtrl', ['$scope', function($scope) {
  
  var hmmmEditor = ace.edit("hmmm-editor");
  hmmmEditor.setTheme("ace/theme/monokai");
  hmmmEditor.setHighlightActiveLine(false);
  hmmmEditor.setShowPrintMargin(false);

  var binEditor = ace.edit("bin-editor");
  binEditor.setTheme("ace/theme/monokai");
  binEditor.setReadOnly(true);
  binEditor.setHighlightActiveLine(false);
  binEditor.setShowPrintMargin(false);
  
  var assembler = new HmmmAssembler();
  
  var Range = ace.require("ace/range").Range;
  
  var errorMarkerIds = [];
  
  $scope.assemble = function() {
    
    var session = hmmmEditor.session;
    session.clearAnnotations();
    errorMarkerIds.forEach(function(markerId) {
      session.removeMarker(markerId);
    });
    errorMarkerIds = [];
    
    var output = assembler.assemble(hmmmEditor.getValue());
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
      
      binEditor.setValue("");
    }
    else {
      binEditor.setValue(output.binary);
    }
  }
  
}]);

app.controller('SimulatorCtrl', ['$scope', function($scope) {
  var hmmmConsole = ace.edit("hmmm-console");
  hmmmConsole.setTheme("ace/theme/monokai");
  hmmmConsole.setReadOnly(true);
  hmmmConsole.setShowPrintMargin(false);
  hmmmConsole.renderer.setShowGutter(false);
  
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
  
}]);