describe('Distance Controller', function() {

  var DistCtrl = null;
  var scope = null;

  // Confirmed that Karma can instantiate this module
  beforeEach(module('guber'));
  
  beforeEach(inject(function ($rootScope, $controller) {
    scope = $rootScope.$new();
    DistCtrl = $controller('NavCtrl', {
      $scope: scope
    });
  }));
  
  it('Say GGC', function () {
    expect(scope.test).toEqual("Georgia Gwinnett College");
  });

});
