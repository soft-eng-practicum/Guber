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
				postPromise: ['posts', function(posts){
					return posts.getAll();
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

app.controller('MainCtrl', [
	'$scope',
	'posts',
	'auth',
	function($scope, posts, auth){
		$scope.posts = posts.posts;
		$scope.addPost = function(){
			if(!$scope.title || $scope.title === '') { return; }
			posts.create({
				title: $scope.title,
				link: $scope.link
			});
			$scope.title = '';
			$scope.link = '';
		 };
		 $scope.incrementUpvotes = function(post) {
		   posts.upvote(post);
		 };
		 $scope.decrementUpvotes = function(post) {
		   posts.downvote(post);
		 };
		 $scope.isLoggedIn = auth.isLoggedIn;
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

app.factory('auth', ['$http', '$window', function($http, $window){
  var auth = {};

	auth.saveToken = function (token){
	  $window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function (){
	  return $window.localStorage['flapper-news-token'];
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

	auth.currentUser = function(){
	  if(auth.isLoggedIn()){
	    var token = auth.getToken();
	    var payload = JSON.parse($window.atob(token.split('.')[1]));

	    return payload.username;
	  }
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
	  $window.localStorage.removeItem('flapper-news-token');
	};

  return auth;
}])
