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

app.factory('dist', function(){
	var dist = {};
	dist.getDistance = function(thisUser, otherUser){
		return 5;
	};
	return dist;
});

app.factory('auth', ['$http', '$window', function($http, $window){
  var auth = {};

	auth.saveToken = function (token){
	  $window.localStorage['guber-token'] = token;
	};

	auth.getToken = function (){
	  return $window.localStorage['guber-token'];
	};
	
	//Method to save the user object.
	app.factory('user', ['$http', '$window', function($http, $window){
  var user = {};

	auth.saveUser = function (token){
	  $window.localStorage['user-token'] = token;
	};

	auth.getUser = function (){
	  return $window.localStorage['user-token'];
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
	  });
	};

	auth.logIn = function(user){
	  return $http.post('/login', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};

	auth.logOut = function(){
	  $window.localStorage.removeItem('guber-token');
	};

  return auth;
}])

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
			// Test statement - to be removed later
			console.log($scope.user);
	  };

	  $scope.logIn = function(){
	    auth.logIn($scope.user).error(function(error){
	      $scope.error = error;
	    }).then(function(){
	      $state.go('home');
	    });
			// Test statement - to be removed later
			console.log($scope.user);
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

		$scope.calcDist = function() {
			var start = document.getElementById("start").value;
	    var end = document.getElementById("end").value;
	    var distanceInput = document.getElementById("distance");

	    var request = {
	      origin:start,
	      destination:end,
	      travelMode: google.maps.DirectionsTravelMode.DRIVING
	    };

	    directionsService.route(request, function(response, status) {
	      if (status == google.maps.DirectionsStatus.OK) {
	        directionsDisplay.setDirections(response);
	        distanceInput.value = response.routes[0].legs[0].distance.value / 1609.34;
	        distanceInput.innerHTML = response.routes[0].legs[0].distance.value / 1609.34;
	      };
	    });
	  };
}]);
