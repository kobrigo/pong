var lobbyModule = angular.module('lobby', ['common']);

lobbyModule.controller('lobbyController', ['$scope', '$location', 'game-console-service', 'socket', function($scope, $location, gameConsole, socket) {
   gameConsole.log('opened the lobby screen');

   $scope.players = [
      {nickname: 'eyal'},
      {nickname: 'nurit'}
   ];

   $scope.createGame = function() {
      //open the game screen
      $location.path('game');
   };

   function updatePlayers(data){
      $scope.players = data;
   }

   function handlePlayers(data){
      updatePlayers(data);
   }

   function handleEnterLobbyOk(data){
      updatePlayers(data);
   }

   function handleExitLobbyOk(){

   }

   $scope.logout = function() {
      socket.emit('exit-lobby');
      socket.on('exit-lobby-ok', handleExitLobbyOk);
   };

   socket.emit('enter-lobby');
   socket.on('enter-lobby-ok', handleEnterLobbyOk);
   socket.on('players', handlePlayers);

   $scope.$on('$destroy', function() {
      // say goodbye to your controller here
      // release resources, cancel request...
      socket.off('exit-lobby-ok', handleExitLobbyOk);
      socket.off('enter-lobby-ok', handleEnterLobbyOk);
      socket.off('enter-lobby-ok', handlePlayers);
   })
}]);


