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
				postPromise: ['users', function(users){
					return users.getAll();
				}]
			}
		});

		$stateProvider
			.state('users', {
			  url: '/users/{id}',
			  templateUrl: '/users.html',
			  controller: 'UsersCtrl',
			  resolve: {
			    user: ['$stateParams', 'users', function($stateParams, users) {
			      return users.get($stateParams.id);
			    }]
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

	$urlRouterProvider.otherwise('home');
}]);

app.factory('users', ['$http', 'auth', function($http, auth){
	var o = {
		users: []
		};
		o.getAll = function() {
	    return $http.get('/users').success(function(data){
	      angular.copy(data, o.users);
	    });
	  };
		o.create = function(user) {
		  return $http.post('/users', user, {
		    headers: {Authorization: 'Bearer '+auth.getToken()}
		  }).success(function(data){
		    o.users.push(data);
		  });
		};
		o.get = function(id) {
		  return $http.get('/users/' + id).then(function(res){
		    return res.data;
		  });
		};

		return o;
}]);

app.controller('MainCtrl', [
	'$scope',
	'auth',
	'users',
	function($scope, auth, users){
		$scope.users = users.users;
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

app.factory('auth', ['$http', '$window', function($http, $window){
  var auth = {};

	auth.saveUser = function (currentUser){
		$window.localStorage['user'] = currentUser;
	};

	auth.getUser = function (){
		console.log($window.localStorage['user']);
		return $window.localStorage['user'];
	};

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
	'users',
	'$q',
	'$timeout',
	function($scope, auth, $q, $timeout){
    var directionsService = new google.maps.DirectionsService();
		$scope.ggc = "Georgia Gwinnett College";
		$scope.potentialDrivers = [];

		$scope.ride = false;

		$scope.getDrivers = function(users, $q) {

			// Use authentication to retrieve current username
			var currentUsername = auth.currentUserName();
			var currentUser;

			// Finds currentUser object based of their username
			angular.forEach($scope.users, function(user, key) {
				if (user.username == currentUsername) {
					currentUser = user;
				}
			});

			// Loop through users in database and check for potential drivers
			// angular.forEach($scope.users, function(user, key) {
			// 	if(currentUsername != user.username){
			// 		this.log('rider: ' + currentUser.username);
			// 		this.log('driver: ' + user.username);
			//
			// 		$scope.ride = $scope.giveRide(currentUser.homeAddress, user.homeAddress);
			//
			// 		console.log('Ride? ' + $scope.ride);
			// 	}
			// }, console);
		}

		// $scope.getDriver = function() {
		// 	return document.getElementById("driver").value;
		// }
		//
		// $scope.getRider = function() {
		// 	return document.getElementById("rider").value;
		// }

		// Given driver and rider addresses, determines if rider is close enough for a ride
		$scope.giveRide = function( driverAddress, riderAddress ) {
			var wRider1, wRider2, woRider;
			var i=0;
			var rideResult = document.getElementById("rideResult");

			// Request to send to Google server
			var request1 = {
				origin:driverAddress,
				destination:riderAddress,
				travelMode: google.maps.DirectionsTravelMode.DRIVING
			};
			var request2 = {
				origin:riderAddress,
				destination:$scope.ggc,
				travelMode: google.maps.DirectionsTravelMode.DRIVING
			};
			var request3 = {
				origin:driverAddress,
				destination:$scope.ggc,
				travelMode: google.maps.DirectionsTravelMode.DRIVING
			};

			// Send requests to Google server
			directionsService.route(request1, function(response, status) {
	      if (status == google.maps.DirectionsStatus.OK) {
	        directionsDisplay.setDirections(response);
	        wRider1 = response.routes[0].legs[0].duration.value;
					i++; // Add one to count of results
					$scope.$broadcast('googleEvent'); // Broadcast when result comes back
	      };
	  	});
			directionsService.route(request2, function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(response);
					wRider2 = response.routes[0].legs[0].duration.value;
					i++; // Add one to count of results
					$scope.$broadcast('googleEvent'); // Broadcast when result comes back
				};
			});
			directionsService.route(request3, function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(response);
					woRider = response.routes[0].legs[0].duration.value;
					i++; // Add one to count of results
					$scope.$broadcast('googleEvent'); // Broadcast when result comes back
				};
			});

			// Wait for all three results to come back
			$scope.$on('googleEvent', function () {
				if (i>=3) {

					// If rider adds no more than 10 min = 600 sec to drive, give ride
					if (wRider1 + wRider2 <= woRider + 600) {
						rideResult.value = 'Yes'; // HTML element id, for UI
						return true; // Return boolean for computations
					}
					// Otherwise, don't
					else {
						rideResult.value = 'No'; // HTML element id, for UI
						return false // Return boolean for computations
					}
				};
			});
		}
}]);

app.controller('UsersCtrl', [
	'$scope',
	'users',
	'user',
	'auth',
	function($scope, users, user, auth){
	  $scope.user = user;
		$scope.addComment = function(){
		  if($scope.body === '') { return; }
		  users.addComment(user._id, {
		    body: $scope.body,
		    author: 'user',
		  }).success(function(comment) {
		    $scope.user.comments.push(comment);
		  });
		  $scope.body = '';
		};
		$scope.isLoggedIn = auth.isLoggedIn;
}]);
