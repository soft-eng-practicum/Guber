var app = angular.module('guber', ['ui.router']);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {

	$stateProvider
		.state('home', {
			url: '/home',
			templateUrl: '/home.html',
			controller: 'MainCtrl',
			resolve: {
			}
		});

	$stateProvider
		.state('login', {
		  url: '/login',
		  templateUrl: '/login.html',
		  controller: 'AuthCtrl',
		  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      $state.go('home');
		    }
	  	}]
		});

	$stateProvider
		.state('register', {
		  url: '/register',
		  templateUrl: '/register.html',
		  controller: 'AuthCtrl',
		  onEnter: ['$state', 'auth', function($state, auth){
		    if(auth.isLoggedIn()){
		      $state.go('home');
		    }
		  }]
		});

	$stateProvider
		.state('distTest', {
		  url: '/distTest',
		  templateUrl: '/distTest.html',
		  controller: 'DistCtrl',
		});

	$urlRouterProvider.otherwise('home');
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
  var auth = {};

	auth.saveToken = function (token){
	  $window.localStorage['guber-token'] = token;
	};

	auth.getToken = function (){

	  return $window.localStorage['guber-token'];
	};

	auth.isLoggedIn = function(){
		var token = auth.getToken();

		if(token){
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUserName = function(){
		if(auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		};
	};

	auth.register = function(user){
		return $http.post('/register', user).success(function(data){
			auth.saveToken(data.token);
			auth.saveUser(user);
		});
	};

	auth.logIn = function(user){
		return $http.post('/login', user).success(function(data){
			auth.saveToken(data.token);
			auth.saveUser(user);
		});
	};

	auth.logOut = function(){
		$window.localStorage.removeItem('guber-token');
	};

	return auth;
}]);

//Method to save the user object.
app.factory('user', ['$http', '$window', function($http, $window){
	var user = {};

	auth.saveUser = function (token){
		$window.localStorage['user-token'] = token;
	};

	auth.getUser = function (){
		return $window.localStorage['user-token'];
	};


	return user;
}]);

app.controller('MainCtrl', [
	'$scope',
	'auth',
	function($scope, auth){
		 $scope.isLoggedIn = auth.isLoggedIn;
		 $scope.initialize = function() {
		     directionsDisplay = new google.maps.DirectionsRenderer();
		     var melbourne = new google.maps.LatLng(-37.813187, 144.96298);
		     var myOptions = {
		       zoom:12,
		       mapTypeId: google.maps.MapTypeId.ROADMAP,
		       center: melbourne
		     };
			 };
}]);

app.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth){
	  $scope.user = {};

	  $scope.register = function(){
	    auth.register($scope.user).error(function(error){
	      $scope.error = error;
	    }).then(function(){
	      $state.go('home');
	    });
	  };

	  $scope.logIn = function(){
	    auth.logIn($scope.user).error(function(error){
	      $scope.error = error;
	    }).then(function(){
	      $state.go('home');
	    });
	  };
}])

app.controller('NavCtrl', [
	'$scope',
	'auth',
	function($scope, auth){
		$scope.isLoggedIn = auth.isLoggedIn;
	  $scope.currentUserName = auth.currentUserName;
	  $scope.logOut = auth.logOut;
}]);

app.controller('DistCtrl', [
	'$scope',
	'auth',
	function($scope, auth){
    var directionsService = new google.maps.DirectionsService();
		$scope.ggc = "Georgia Gwinnett College";

		$scope.getDriver = function() {
			return document.getElementById("driver").value;
		}

		$scope.getRider = function() {
			return document.getElementById("rider").value;
		}

		$scope.giveRide = function( driver, rider ) {
			var wRider1, wRider2, woRider;
			var i=0;
			var ride = document.getElementById("rideResult");

			var request1 = {
				origin:driver,
				destination:rider,
				travelMode: google.maps.DirectionsTravelMode.DRIVING
			};
			var request2 = {
				origin:rider,
				destination:$scope.ggc,
				travelMode: google.maps.DirectionsTravelMode.DRIVING
			};
			var request3 = {
				origin:driver,
				destination:$scope.ggc,
				travelMode: google.maps.DirectionsTravelMode.DRIVING
			};

			directionsService.route(request1, function(response, status) {
	      if (status == google.maps.DirectionsStatus.OK) {
	        directionsDisplay.setDirections(response);
	        wRider1 = response.routes[0].legs[0].duration.value;
					i++;
					$scope.$broadcast('googleEvent');
	      };
	  	});
			directionsService.route(request2, function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(response);
					wRider2 = response.routes[0].legs[0].duration.value;
					i++;
					$scope.$broadcast('googleEvent');
				};
			});
			directionsService.route(request3, function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(response);
					woRider = response.routes[0].legs[0].duration.value;
					i++;
					$scope.$broadcast('googleEvent');
				};
			});

			// Wait for all three distances to be computed
			$scope.$on('googleEvent', function () {
				if (i>=3) {
					console.log(wRider1);
					console.log(wRider2);
					console.log(woRider);

					// If rider adds no more than 10 minutes to drive, give ride
					if (wRider1 + wRider2 <= woRider + 600) { ride.value = 'Yes'; }
					else { ride.value = 'No'; }
				};
			});
		}
}]);
