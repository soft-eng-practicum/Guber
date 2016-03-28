describe('Distance Controller', function() {

  var DistCtrl = null;
  var scope = null;

  beforeEach(module('guber'));

  beforeEach(inject(function ($rootScope, $controller) {
    scope = $rootScope.$new();
    DistCtrl = $controller('DistCtrl', {
      $scope: scope
    });
  }));

  it('Say GGC', function () {
    expect(scope.ggc).toEqual("Georgia Gwinnett College");
  });

});
