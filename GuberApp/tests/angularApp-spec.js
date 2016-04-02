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

  it('Should say GGC ', function () {
    expect(scope.ggc).toEqual("Georgia Gwinnett College");
  });

});

describe('Auth factory ', function() {

  var auth;
  var window = null;

  beforeEach(function() {
    module('guber');

    inject( function($injector) {
      auth = $injector.get('auth');
    });

    window = { localStorage: {'guber-token': "Hello"} };
  });

  it('Should save and retrieve token ', function() {
    expect(window.localStorage['guber-token']).toBe('Hello');
    auth.saveToken('Hi');
    expect(auth.getToken()).toBe('Hi');
  });

});
