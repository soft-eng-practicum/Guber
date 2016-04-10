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
	'$q',
	'users',
	function($scope, auth, $q){
    var directionsService = new google.maps.DirectionsService();
		$scope.ggc = "Georgia Gwinnett College";
		$scope.potentialDrivers = [];

		// Find driving duration from google server, returns promise.
		googleRequest = function(address1, address2){
			var output = null;
			var deferred = $q.defer();

			var request = {
				origin: address1,
				destination: address2,
				travelMode: google.maps.DirectionsTravelMode.DRIVING
			};

			// Send requests to Google server
			directionsService.route(request, function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					directionsDisplay.setDirections(response);
					output = response.routes[0].legs[0].duration.value;
					deferred.resolve(output);
				};
			})

			return deferred.promise;
		}

		// Given driver and rider addresses, determines if rider is close enough for a ride
		giveRide = function( driverAddress, riderAddress ) {
			var wRider1, wRider2, woRider;
			var i=0;
			var output = null;
			var deferred = $q.defer();

			googleRequest(driverAddress, riderAddress)
				.then(function(result){
					wRider1 = result;
					i++;
					$scope.$broadcast('googleEvent');
				});
			googleRequest(riderAddress, $scope.ggc)
				.then(function(result){
					wRider2 = result;
					i++;
					$scope.$broadcast('googleEvent');
				});
			googleRequest(driverAddress, $scope.ggc)
				.then(function(result){
					woRider = result;
					i++;
					$scope.$broadcast('googleEvent');
				});

			$scope.$on('googleEvent', function () {
				if (i>=3) {
					// If rider adds no more than 10 min = 600 sec to drive, give ride
					if (wRider1 + wRider2 <= woRider + 600) {
						output = true; // Return boolean for computations
					}
					// Otherwise, don't
					else {
						output = false // Return boolean for computations
					}
					deferred.resolve(output);
				};
			});

			return deferred.promise;
		}

		// Method called by 'Get ride' button on main webpage
		$scope.getDrivers = function(users) {

			// Use authentication to retrieve current username
			var currentUsername = auth.currentUserName();
			var currentUser;

			// Finds currentUser object based of their username
			angular.forEach($scope.users, function(user, key) {
				if (user.username == currentUsername) {
					currentUser = user;
				}
			});

			// Essentially a for loop --> for(user in $scop.users)
			$q.all($scope.users.map(function(user) {
				if (currentUser.username != user.username){
					console.log(user.username);
			    return giveRide(user.homeAddress, currentUser.homeAddress)
						.then(function (response) {
							console.log('giveRide returns: ' + user.username + " " + response);
							/*
								The promise return a response. The response is boolean.
								True means currentUser is close enough to get a ride from user.
								Inside the if statement, you can get the driver's phone number with
								user.phoneNumber.
								
								Issue: Right now, not all users are returning a response.
									The ones that do look correct, though.
							*/
							if(reponse){
								// Put code here about what you want to do with the response.




							}
						}, function(error) {
							console.log('giveRide error from ' + user.username);
						});
			}}))
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
