var gameModule = angular.module('game', ['common']);

function Shape() {
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
}

function Player() {
	this.nickname = null;
	this.graphics = new Shape();
}

gameModule.controller('game', ['$scope', 'socket', 'game-console-service', function($scope, socket, gameConsole) {
	gameConsole.log('Entring Game');
	$scope.id = '';
	socket.emit('player-enter-game');

	$scope.initiatorNickname = "";
	$scope.opposingNickname = "";

	$scope.handlePlayerEnterGameOk = function(data) {
		gameConsole.log("Player: " + data.nickname + " entered the game!");
		if(data.isInitiator){
			$scope.initiatorNickname = data.nickname;
		} else {
			$scope.opposingNickname = data.nickname;
		}
	};

	$scope.handlePlayerLeftGame = function(data) {
		//TODO handle the case where the player left the game in the middle. or not in the middle.
		gameConsole.log("Player: " + data.nickname + " left the game!");
	};

	socket.on('player-enter-game-ok', $scope.handlePlayerEnterGameOk);
	socket.on('player-left-game', $scope.handlePlayerLeftGame);

	$scope.$on('$destroy', function() {
		socket.off('player-enter-game-ok', $scope.handlePlayerEnterGameOk);
		socket.off('player-left-game', $scope.handlePlayerLeftGame);
	});
}]);

//
//gameModule.controller('gameController', ['$scope', '$location', 'game-console-service', 'socket', 'me',
//   function($scope, $location, gameConsole, socket, me) {
//
//      $scope.leftPlayer = new Player();
//      $scope.rightPlayer = new Player();
//
//      $scope.ballPosition = new Shape();
//   }
//]);
//



