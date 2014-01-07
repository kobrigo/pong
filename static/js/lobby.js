var lobbyModule = angular.module('lobby', ['common']);

lobbyModule.controller('lobbyController', ['$scope', '$location', 'game-console-service', 'socket', 'me', function($scope, $location, gameConsole, socket, me) {
   gameConsole.log('opened the lobby screen');

   $scope.players = [];
   $scope.chatMessages = [];
   $scope.nextMessage = "";
   $scope.selectedPlayer = null;
   $scope.myNickname = me.nickname;

   $scope.createGame = function() {
      //open the game screen
      $location.path('game');
   };

   $scope.sendChatMessage = function() {
      socket.emit('player-send-chat-message', $scope.nextMessage);
      $scope.nextMessage = "";
   };

   $scope.handlePlayerSelected = function(selectedPlayer) {
      if (selectedPlayer.nickname === me.nickname) {
         alert("you cannot select yourself as the player to play against");
         return;
      } else if (selectedPlayer === $scope.selectedPlayer){
         $scope.selectedPlayer = null;
         return;
      }

      $scope.selectedPlayer = selectedPlayer;
   };

   $scope.exit = function() {

   };

   function updatePlayers(data) {
      $scope.players = data;
   }

   function handlePlayers(data) {
      updatePlayers(data);
   }

   function handleEnterLobbyOk(data) {
      updatePlayers(data);
   }

   function handleExitLobbyOk() {
      $location.path('login');
   }

   function handlePlayerLeft(playerNickName) {
      gameConsole.log(playerNickName + " has left. :-(");
   }

   function handlePlayerJoined(playerNickName) {
      gameConsole.log(playerNickName + " has joined. :-)");
   }

   function handlePlayerChatMessage(chatMessageData) {
      $scope.chatMessages.push(chatMessageData);
   }

   $scope.logout = function() {
      socket.emit('exit-lobby');
      socket.on('exit-lobby-ok', handleExitLobbyOk);
   };

   socket.emit('enter-lobby');
   socket.on('enter-lobby-ok', handleEnterLobbyOk);
   socket.on('players', handlePlayers);
   socket.on('player-left', handlePlayerLeft);
   socket.on('player-joined', handlePlayerJoined);
   socket.on('player-chat-message', handlePlayerChatMessage);


   $scope.$on('$destroy', function() {
      // say goodbye to your controller here
      // release resources, cancel request...
      socket.off('exit-lobby-ok', handleExitLobbyOk);
      socket.off('enter-lobby-ok', handleEnterLobbyOk);
      socket.off('players', handlePlayers);
      socket.off('player-left', handlePlayerLeft);
      socket.off('player-joined', handlePlayerJoined);
   })
}]);

lobbyModule.directive('chatScreen', function() {
   return {
      replace: true,
      restrict: 'E',
      templateUrl: 'templates/chat.html',
      link: function($scope, elm) {
         //define a watch so we can scroll the messages down as they come:
         $scope.$watchCollection('chatMessages', function() {
            elm.scrollTop(elm[0].scrollHeight);
         });
      }
   }
});


