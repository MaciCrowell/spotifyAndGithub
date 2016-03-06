angular.module('myApp.homeView', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: '/views/homeView/home.html',
    controller: 'homeController'
  });
}])

.controller('homeController', ['$scope','$window', '$http', function($scope,$window, $http) {
	console.log("homeController loaded");


    $scope.user = {};
    $scope.playlists = {};

	$scope.logout = function (){
    	//$location.path( '/auth/spotify' );
    	$window.location.href = '/auth/logout';
	};

    $http.get('/getCurrentUser')
        .success(function(data) {
            $scope.user = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        })

    $http.get('/getCurrentUserPlaylists')
        .success(function(data){
            $scope.playlists = data;
            console.log(data)
        })
        .error(function(data) {
            console.log('Error: ' + data)
        })

    $scope.backupPlaylist = function(playlist) {
        console.log('Backing up playlist ' + playlist.name + '!')

        var POSTplaylist = {user: playlist.owner.id, id: playlist.id}
        $http.post('/backupPlaylist', POSTplaylist)
            .success(function(data) {
                console.log("playlist save successfull");
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    }

    console.log($scope);
}]);