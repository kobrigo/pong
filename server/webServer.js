/**
 * Created with JetBrains WebStorm.
 * User: kobrigo
 * Date: 12/04/13
 * Time: 23:50
 * To change this template use File | Settings | File Templates.
 */
var express = require('express');
var path = require('path');
var socketIo = require('socket.io');
var _ = require('lodash-node');

var consts = {
   webServerPort: 9022,
   webSocketPort: 3001
};

//create the listening to io socket connections.
console.log("Listening for socket.io connections on port:" + consts.webSocketPort);
var io = socketIo.listen(consts.webSocketPort);

var pathToServe = path.normalize(path.join(__dirname, './../static/'));
var appWS = express();
require('http').createServer(appWS);
console.log("Serving: " + pathToServe + " on port:" + consts.webServerPort);
appWS.use(function(req, res, next) {
   res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
   next();
});
appWS.use("/", express.static(pathToServe));
appWS.listen(consts.webServerPort);

var pendingPlayer = {};
var playersInLobby = {};
var nickNamesToPlayer = {};
var games = [];
var chatMessageId = 0;

function Player(socket) {
   this.socket = socket;
   this.nickname = null;
}

function Game(settings) {
   this.settings = settings;
}

function broadcast(messageId, message) {
   _.forEach(playersInLobby, function(player) {
      player.socket.emit(messageId, message)
   })
}

function getAllPlayersData() {
   var playersData = [];
   _.forOwn(nickNamesToPlayer, function(client) {
      playersData.push({nickname: client.nickname})
   });

   return playersData;
}

io.sockets.on('connection', function(socket) {

   var newPlayer = new Player(socket);
   pendingPlayer[socket.id] = newPlayer;

   socket.on('login', function(data) {
      player = pendingPlayer[socket.id];
      if (player) {
         //save the nick name of the client and add it to the list of player waiting in the lobby
         player.nickname = data.nickname;

         if (nickNamesToPlayer[player.nickname]) {
            //this mean that this nick name is already taken
            player.socket.emit('login-error', {reason: 'Nickname is already taken.'});
            return;
         }

         //move the player from the pending players list to the lobby;
         playersInLobby[socket.id] = player;
         nickNamesToPlayer[player.nickname] = player;
         delete pendingPlayer[socket.id];

         //let all the other players in the lobby that there is a new player by sending the the updated
         //list of players.
         broadcast('player-joined', player.nickname);
         var playersData = getAllPlayersData();
         broadcast('players', playersData);
         socket.emit('login-ok');

      } else {
         console.log("could not find the socket.id:" + socket.id + "in the list of pending players.");
      }
   });

   socket.on('enter-lobby', function() {
      var playersData = getAllPlayersData();
      socket.emit('enter-lobby-ok', playersData);
   });

   socket.on('disconnect', function() {
      console.log('disconnected from player id: ' + socket.id);
      //TODO:
      //1. if there is a game with this player find close the game deleting the game instance
      //2. move the player that is still connected to the lobby.

      // handle the disconnection from this player
      delete pendingPlayer[socket.id];

      if (playersInLobby[socket.id]) {
         var player = playersInLobby[socket.id];
         console.log('player nickname was: ' + player.nickname);
         delete nickNamesToPlayer[player.nickname];
         delete playersInLobby[socket.id];

         broadcast('player-left', player.nickname);
      }

      //update all the player that a player has left (those that are in the lobby)
      var playersData = getAllPlayersData();
      broadcast('players', playersData);
   });

   socket.on('player-send-chat-message', function(message) {
      var player = playersInLobby[socket.id];
      broadcast('player-chat-message', {nickname: player.nickname, message: message, id: chatMessageId});
      chatMessageId++;
   });

   socket.on('start-game', function(data) {
      //TODO:
      //1. find the player that we want to play with
      //2. find the the socket this message has come from
      //3. remove them from the hash of players in the lobby
      //4. Create a game instance with these tow players.
      //5. Add the Game instance to the active list of games that will be shown in the lobby.
   });

   socket.on('client-message', function(data) {
      console.log(data);
   });

   //   //just brodcast every 1 second for now.
   //   setInterval(function() {
   //      socket.emit('news', { theNews: 'this is the news' });
   //
   //   }, 1000);
});
