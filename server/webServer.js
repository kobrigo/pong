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
var PongGame = require('./game');
var Player = require('./player');
var _ = require('lodash-node');

var consts = {
	webServerPort: 80,
	timeoutToEnterTheGameScreen: 30000
};

var pathToServe = path.normalize(path.join(__dirname, './../static/'));
var phaserPath = path.normalize(path.join(__dirname, './../../phaser/'));

var appWS = express();
var server = require('http').createServer(appWS);
var io = socketIo.listen(server);
console.log("Serving: " + pathToServe + " on port:" + consts.webServerPort);
appWS.use(function(req, res, next) {
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	next();
});
appWS.use("/", express.static(pathToServe));
appWS.use("/", express.static(phaserPath));
server.listen(consts.webServerPort);

var chatMessageId = 0;
/**
 * This counter will be used to create a unique room number for two players to play with one another.
 * @type {number}
 */
var gameRooomId = 0;
var games = {};

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
		var allClients = io.sockets.clients('lobby');
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

	/**
	 * {string} data.opposedPlayerNickname the nickname of the player that this player has asked to play with
	 */
	socket.on('request-to-play', function(data) {
		//TODO: just as a percussion check that the client did not hack the code and trying to play against itself
		//find the player that this player wants to play with.
		var socketOfPlayerToPlayWith = _.find(io.sockets.clients('lobby'), function(currentSocket) {
			return currentSocket.player.nickname === data.opposedPlayerNickname;
		});

		if (_.isEmpty(socketOfPlayerToPlayWith)) {
			socket.emit('request-to-play-error', 'could not find the player ' + data.opposedPlayerNickname + ' you asked to play with in the lobby');
		}
		// remove it from the lobby
		socketOfPlayerToPlayWith.leave('lobby');
		socket.leave('lobby');
		//create a game room for them to play with one another.
		++gameRooomId;
		var gameId = 'game' + gameRooomId;
		socket.join(gameId);
		socketOfPlayerToPlayWith.join(gameId);

		//Create a game instance with these tow players.
		var game = new PongGame({
			io:io,
			initiatorPlayer: socket.player,
			opposedPlayer: socketOfPlayerToPlayWith.player,
			id: gameId
		});

		//Add the Game instance to the active list of games that will be shown in the lobby.
		games[gameId] = game;

		//send a message to the players and wait for them to enter the game screen.
		io.sockets.in(gameId).emit("request-to-play-ok");

		//set a timeout of 30 seconds if both them did not enter the room by then pop them out of the game back to the lobby
		setTimeout(function() {
			if (game.playersInTheGameScreen < 2) {
				//throw them back to the lobby and destroy the game
				game.destroy();
				delete games.gameId;
			}
		}, consts.timeoutToEnterTheGameScreen);

		console.log(game.initiatorPlayer.nickname + 'and ' + game.opposedPlayer.nickname + 'entered game room:' + game.id);
		//TODO add the active list of games in the lobby in the client side.
	});

	socket.on('client-message', function(data) {
		console.log(data);
	});

});
