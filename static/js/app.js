var appModule = angular.module('app', ['game', 'lobby', 'common']);


appModule.run(['game-console-service', '$rootScope', 'socket', function(gameConsole, $rootscope, appSocket){
    appSocket.on('news', function(data) {
        gameConsole.log(data.theNews);
        appSocket.emit('client-message', {data:'this is eyals data'});
    });
}]);
