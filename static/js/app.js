var appModule = angular.module('app', ['game', 'lobby', 'common', 'ngRoute', 'login']);

appModule.config(['$routeProvider', function($routeProvider) {
   $routeProvider.
      when('/login', {
         templateUrl: 'templates/login.html'
      }).
      when('/lobby', {
         templateUrl: 'templates/lobby.html'
      }).
      when('/game', {
         templateUrl: 'templates/game.html'
      }).
      otherwise({
         redirectTo: '/login'
      });
}]);

appModule.run(['game-console-service', '$rootScope', 'socket', function(gameConsole, $rootscope, appSocket) {

   appSocket.on('disconnect', function(data) {
      gameConsole.log("Server Disconnected");
   });
}]);
