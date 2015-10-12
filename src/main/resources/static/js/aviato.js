angular.module('aviato', [ 'ngRoute', 'ngCookies' ])
	.config(function($routeProvider, $httpProvider) {
		$routeProvider.when('/', {
			templateUrl: 'home.html',
			controller: 'home'
		})
		.when('/login', {
			templateUrl: 'login.html',
			controller: 'navigation'
		})
		.otherwise('/');

		$httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
	})
	.controller('home', function($scope, $http, $cookies) {

		$http.get('/api/flightSearch').success(function(data) {
			$scope.greeting = data;
		});

		var originCookie = $cookies.get('originCookie');
		if (originCookie) $scope.origin = originCookie;
		
		var destinationCookie = $cookies.get('destinationCookie');
		if (destinationCookie) $scope.destination = destinationCookie;
		
		var today = new Date();
		$scope.departDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
		$scope.returnDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);;

		$scope.flightSearch = function() {

			$cookies.put('originCookie', $scope.origin);
			$cookies.put('destinationCookie', $scope.destination);

			var request = {
					origin: $scope.origin,
					destination: $scope.destination,
					departDate: $scope.departDate.toISOString().slice(0, 10),
					returnDate: $scope.returnDate.toISOString().slice(0, 10)
			};

			$http.post('/api/flightSearch', request)
				.success(function(data) {
					$scope.results = data;
				})
				.error(function(data, status, headers, config) {
					alert("Fail! message: " + JSON.stringify({data: data}));
				});
		}
	})
	.controller('navigation', function($rootScope, $scope, $http, $location, $route, $window) {

		$scope.tab = function(route) {
			return $route.current && route === $route.current.controller;
		}

		var authenticate = function(credentials, callback) {

			var headers = credentials ? {
				authorization: 'Basic ' + btoa(credentials.username + ':' + credentials.password)
			} : {};

			$http.get('/user', {headers: headers}).success(function(data) {
				if (data.name) {
					$rootScope.authenticated = true;
				} else {
					$rootScope.authenticated = false;
				}
				callback && callback();
			})
			.error(function() {
				$rootScope.authenticated = false;
				callback && callback();
			});
		}

		// Is user already logged in?
		authenticate();

		$scope.credentials = {};

		$scope.login = function() {
			authenticate($scope.credentials, function() {
				if ($rootScope.authenticated) {
					console.log('Login succeeded');
					$location.path('/');
					$scope.error = false;
					$rootScope.authenticated = true;
//					$window.location.assign('/');
				} else {
					console.log('Login failed')
					$location.path('/login');
					$scope.error = true;
					$rootScope.authenticated = false;
				}
			});
		}

		$scope.logout = function() {
			$http.post('logout', {}).success(function() {
				$rootScope.authenticated = false;
				$location.path('/');
			}).error(function(data) {
				console.log('Logout failed')
				$rootScope.authenticated = false;
			});
		}
	});
