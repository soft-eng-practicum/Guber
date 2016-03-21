describe('guber', function () {
    var scope;
    var controller;

    beforeEach(module('guber'));

    describe('DistCtrl', function () {
        beforeEach(inject(function ($rootScope, $controller) {
            scope = $rootScope.$new();
            controller = $controller('DistCtrl', {
                '$scope': scope,
                'start': 'Atlanta, GA',
                'end': 'Boston, MA'
            });
        }));
        it('Should get distance from Atlanta to Boston', function () {
            expect(distanceInput.innerHTML).toBe('1080.8791181478123');
        });
    });
});
