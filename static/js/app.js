$(document).ready(function() {

    function GameConsole(){
        this.consoleWindow = $('.game-console');

        this.log = function(message) {
            this.consoleWindow.append('<div class="console-message">' + message + '</div>');
            this.consoleWindow.scrollTop(this.consoleWindow[0].scrollHeight);
        }
    }

    var gameConsole = new GameConsole();

    var socket = io.connect('http://localhost:3001');
    socket.on('news', function(data) {

        gameConsole.log(data.theNews);
        socket.emit('client-message', { my: 'data' });
    });


});