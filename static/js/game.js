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



