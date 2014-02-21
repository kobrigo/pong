var commonModule = angular.module('common', []);

commonModule.constant('commonConsts', {
	socketUrl: 'http://localhost:3001'
});

commonModule.controller('gameConsoleController', ['$scope', 'game-console-service', function($scope, gameConsoleService) {
	$scope.consoleService = gameConsoleService;
}]);

commonModule.directive('gameConsole', function() {
	return {
		replace: true,
		restrict: 'E',
		template: '<div class="game-console" ng-controller="gameConsoleController">' +
			'<div class="console-message" ng-repeat="message in consoleService.messagesCollection track by message.id">{{message.data}}</div>' +
			'</div>',
		link: function($scope, elm) {
			//define a watch so we can scroll the messages down as they come:
			$scope.$watchCollection('consoleService.messagesCollection', function() {
				elm.scrollTop(elm[0].scrollHeight);
			});
			console.log('linking the game Console');
		}
	}
});

/**
 * This service provides information that is relevant to me. me is this client that is connected to the server
 */
commonModule.factory('me', function() {
	function Me() {
		this.nickname = null;
	}

	return new Me();
});

commonModule.factory('game-console-service', function() {
	function GameConsoleService() {
		this.messagesCollection = [];
		this.maxMessagesNumber = 100;
		this.messageIdCounter = 0;
		this.logAlsoToBrowserConsole = true;

		this.log = function(message) {
			this.messagesCollection.push({data: message, id: this.messageIdCounter});

			if (this.logAlsoToBrowserConsole) {
				console.log(message);
			}

			if (this.messagesCollection.length > this.maxMessagesNumber) {
				this.messagesCollection.shift();
			}
			this.messageIdCounter++;
		}
	}

	return new GameConsoleService();
});

commonModule.factory('socket', ['commonConsts', '$rootScope', '$location', 'game-console-service',
	function(commonConsts, $rootScope, $location, gameConsole) {
		var host = $location.host();
		var socket = io.connect("http://" + host, {
			reconnect: false //disable the socket from auto reconnecting to prevent the errors due to state getting out of sync server and client
		});
		return {
			on: function(eventName, callback) {
				socket.on(eventName, function() {
					var args = arguments;
					$rootScope.$apply(function() {
						callback.apply(socket, args);
					});
				});
			},
			off: function(eventName, callback) {
				socket.removeListener(eventName, callback);
			},
			emit: function(eventName, data, callback) {
				socket.emit(eventName, data, function() {
					var args = arguments;
					$rootScope.$apply(function() {
						if (callback) {
							callback.apply(socket, args);
						}
					});
				})
			}
		};
	}]);


// This directive allows you to handle the pressing of enter on an element when it is in focus
commonModule.directive('ngEnter', function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.ngEnter);
				});

				event.preventDefault();
			}
		});
	};
});




