var loginModule = angular.module('login', ['common']);

loginModule.controller('loginController', ['$scope', '$location', 'game-console-service', 'socket', function($scope, $location, gameConsole, socket) {
   gameConsole.log('enter login screen');

   function handleLoginOk(){
      gameConsole.log("got login-ok");
      $location.path('lobby');
   }

   function handleLoginError(data){
      gameConsole.log("Got login error. Reason: " + data.reason);
   }

   $scope.nickname = "";

   $scope.login = function() {
      socket.emit('login', {nickname: $scope.nickname});
      socket.on('login-ok', handleLoginOk);
      socket.on('login-error', handleLoginError);
   };

   $scope.$on('$destroy', function() {
      // say goodbye to your controller here
      // release resources, cancel request...
      socket.off('login-ok', handleLoginOk);
      socket.off('login-error', handleLoginError);
   })
}]);