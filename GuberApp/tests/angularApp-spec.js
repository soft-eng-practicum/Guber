describe("NavController", function() {
  var $rootScope,
      $scope,
      controller;

  beforeEach(function() {
    module('guber');

    inject(function($injector) {
      $rootScope = $injector.get($rootScope);
      $scope = $rootScope.$new();
      controller = $inject.get('$controler')('NavController', {$scope: $scope});
    });
  });

  describe("Initialization", function() {

  });
});
