function Player(socket, nickname) {
	this.socket = socket;
	this.nickname = nickname;
	this.game = null;
}

module.exports = Player;