var _ = require('lodash-node');

/**
 * The constructor of the pong game.
 * @param {object} settings
 *   {Player} settings.initiatorPlayer the player that has initiated the game.
 *   {Player} settings.opposedPlayer the player that the initiator has chose to play against.
 *   {string} setting.gameId the id of the game which is also the id of the room in which this game is taking place
 * @constructor
 */
function Game(settings) {
	this.settings = settings;
	this.io = settings.io;
	this.playersInTheGameScreen = 0;
	this.id = settings.id;
	this.opposedPlayer = settings.opposedPlayer;
	this.initiatorPlayer = settings.initiatorPlayer;
	this.players = [this.opposedPlayer, this.initiatorPlayer];

	//set this game instance as the parent of these players on each one of their instances
	_.forEach(this.players, function(player) {
		player.game = this;
	}.bind(this));

	this.initiatorPlayer.socket.on('player-enter-game', Game.prototype.handlePlayerEnterGame);
	this.opposedPlayer.socket.on('player-enter-game', Game.prototype.handlePlayerEnterGame);
}

Game.prototype.handlePlayerEnterGame = function() {
	console.log('player-enter-game: ' + this.player.nickname);
	var player = this.player;
	var game = this.player.game;

	game.playersInTheGameScreen++;

	game.io.sockets.in(game.id).emit('player-enter-game-ok', {
		nickname: player.nickname,
		isInitiator: player === game.initiatorPlayer
	});
};

Game.prototype.destroy = function() {
	this.io.sockets.in(this.id).emit('exit-to-lobby');

	//unregister from the events on the socket.
	_.forEach(this.players, function(currentPlayer) {
		currentPlayer.socket.removeListener(Game.prototype.handlePlayerEnterGame);
		//...
	});
};


module.exports = Game;
