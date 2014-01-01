var commonModule = angular.module('common',[]);

commonModule.constant('commonConsts', { socketUrl: 'http://localhost:3001'});

commonModule.controller('gameConsoleController', ['$scope', 'game-console-service', function($scope, gameConsoleService) {
    $scope.consoleService = gameConsoleService;
}]);

commonModule.directive('gameConsole', function() {
    return {
        replace:true,
        restrict: 'E',
        template:
            '<div class="game-console" ng-controller="gameConsoleController">' +
                '<div class="console-message" ng-repeat="message in consoleService.messagesCollection track by message.id">{{message.message}}</div>' +
            '</div>',
        link: function($scope, elm) {
            //define a watch so we can scroll the messages down as they come:
            $scope.$watchCollection('consoleService.messagesCollection', function(){
                elm.scrollTop(elm[0].scrollHeight);
            });
            console.log('linking the game Console');
        }
    }
});

commonModule.factory('game-console-service', function(){
    function GameConsoleService(){
        this.messagesCollection = [];
        this.maxMessagesNumber = 100;
        this.messageIdCounter = 0;

        this.log = function(message) {
            this.messagesCollection.push({message:message, id:this.messageIdCounter});
            if(this.messagesCollection.length > this.maxMessagesNumber){
                this.messagesCollection.shift();
            }
            this.messageIdCounter++;
        }
    }

   return new GameConsoleService();
});

commonModule.factory('socket', ['commonConsts', '$rootScope', function (commonConsts, $rootScope) {
    var socket = io.connect(commonConsts.socketUrl);
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
}]);





