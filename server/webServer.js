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
	webServerPort: 9022
};

var pathToServe = path.normalize(path.join(__dirname, './../static/'));
var appWS = express();
var server = require('http').createServer(appWS);
var io = socketIo.listen(server);
console.log("Serving: " + pathToServe + " on port:" + consts.webServerPort);
appWS.use(function(req, res, next) {
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	next();
});
appWS.use("/", express.static(pathToServe));
server.listen(consts.webServerPort);

var chatMessageId = 0;

function Player(socket, nickname) {
	this.socket = socket;
	this.nickname = nickname;
}

function Game(settings) {
	this.settings = settings;
}

function getAllPlayersData() {
	var playersData = [];
	var allClients = io.sockets.clients('lobby');
	for (var i = 0, length = allClients.length; i < length; i++) {
		var currentSocket = allClients[i];
		playersData.push({nickname: currentSocket.player.nickname});
	}

	return playersData;
}

io.sockets.on('connection', function(socket) {

	socket.on('login', function(data) {
		var player = new Player(socket, data.nickname);
		//overload the player on the socket itself.
		socket.player = player;

		//Check for the nick name on all the sockets connected
		var allClients = io.sockets.clients();
		for (var i = 0, length = allClients.length; i < length; i++) {
			var currentSocket = allClients[i];
			if ((currentSocket !== socket) && //skip ourselves in the list of all sockets
				currentSocket.player.nickname === socket.player.nickname) {
				//this mean that this nick name is already taken
				player.socket.emit('login-error', {reason: 'Nickname is already taken.'});
				return;
			}
		}

		socket.emit('login-ok');
	});

	socket.on('enter-lobby', function() {
		//add the socket to the lobby before broadcasting all the data.
		socket.join('lobby');

		if (socket.player) {
			//allow only player that passed the login stage to enter the lobby (this should be blocked in the client too)

			//let all the other players in the lobby that there is a new player by sending the the updated
			//list of players.
			io.sockets.in('lobby').emit('player-joined', socket.player.nickname);

			var playersData = getAllPlayersData();
			io.sockets.in('lobby').emit('players', playersData);

			socket.emit('enter-lobby-ok', playersData);
		}
	});

	socket.on('disconnect', function() {
		console.log('disconnected from player id: ' + socket.id);
		//TODO:
		//1. if there is a game with this player find close the game deleting the game instance
		//2. move the player that is still connected to the lobby.
		if (socket.player) {
			//we could have a socket that is not logged in yet and is being disconnected.
			io.sockets.in('lobby').emit('player-left', socket.player.nickname);
		}

		//update all the player that a player has left (those that are in the lobby)
		setTimeout(function() {
			var playersData = getAllPlayersData();
			io.sockets.in('lobby').emit('players', playersData);
		}, 0)
	});

	socket.on('player-send-chat-message', function(message) {

		io.sockets.in('lobby').emit('player-chat-message', {
			nickname: socket.player.nickname,
			message: message,
			id: chatMessageId
		});

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
