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

var pendingClients = {};
var clientsInLobby = {};
var nickNamesToClient = {};
var games = [];

function Client(socket) {
   this.socket = socket;
   this.nickname = null;
}

function Game(settings) {
   this.settings = settings;
}

function broadcast(messageId, message) {
   _.forEach(clientsInLobby, function(client) {
      client.socket.emit(messageId, message)
   })
}

function getAllPlayersData(){
   var playersData = [];
   _.forOwn(nickNamesToClient, function(client) {
      playersData.push({nickname: client.nickname})
   });

   return playersData;
}

io.sockets.on('connection', function(socket) {

   var newClient = new Client(socket);
   pendingClients[socket.id] = newClient;

   socket.on('login', function(data) {
      client = pendingClients[socket.id];
      if (client) {
         //save the nick name of the client and add it to the list of player waiting in the lobby
         client.nickname = data.nickname;

         if (nickNamesToClient[client.nickname]) {
            //this mean that this nick name is already taken
            client.socket.emit('login-error', {reason: 'Nickname is already taken.'});
            return;
         }

         //move the client from the pending clients list to the lobby;
         clientsInLobby[socket.id] = client;
         nickNamesToClient[client.nickname] = client;
         delete pendingClients[socket.id];

         //let all the other clients in the lobby that there is a new player by sending the the updated
         //list of players.
         var playersData = getAllPlayersData();
         broadcast('players', playersData);
         socket.emit('login-ok');

      } else {
         console.log("could not find the socket.id:" + socket.id + "in the list of pending clients.");
      }
   });

   socket.on('enter-lobby', function() {
      var playersData = getAllPlayersData();
      socket.emit('enter-lobby-ok', playersData);
   });

   socket.on('disconnect', function() {
      console.log('disconnect from client id: ' + socket.id);
      //TODO:
      //1. if there is a game with this client find close the game deleting the game instance
      //2. move the player that is still connected to the lobby.

      // handle the disconnection from this client
      delete pendingClients[socket.id];

      if(clientsInLobby[socket.id]){
         console.log('client nickname was: ' + clientsInLobby[socket.id].nickname);
         delete nickNamesToClient[clientsInLobby[socket.id].nickname]
         delete clientsInLobby[socket.id];
      }

      //update all the player that a player has left (those that are in the lobby)
      var playersData = getAllPlayersData();
      broadcast('players', playersData);
   });

   socket.on('start-game', function(data) {
      //TODO:
      //1. find the player that we want to play with
      //2find the the socket this message has come from
      //remove them from the hash of players in the lobby
      //Create a game instance with these tow players.
      //Add the Game instance to the active list of games that will be shown in the lobby.
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
