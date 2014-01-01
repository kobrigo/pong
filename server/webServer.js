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

var consts = {
	webServerPort : 9022,
	webSocketPort : 3001
};

//create the listening to io socket connections.
console.log("Listening for socket.io connections on port:" + consts.webSocketPort);
var io = socketIo.listen(consts.webSocketPort);

var pathToServe = path.normalize(path.join(__dirname, './../static/'));
var appWS = express();
require('http').createServer(appWS);
console.log("Serving" + pathToServe + " on port:" + consts.webServerPort);
appWS.use(function(req, res, next) {
   res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
   next();
});
appWS.use("/", express.static(pathToServe));
appWS.listen(consts.webServerPort);

io.sockets.on('connection', function (socket) {

    socket.on('client-message', function (data) {
        console.log(data);
    });

	//just brodcast every 1 second for now.
	setInterval(function(){
		socket.emit('news', { theNews: 'this is the news' });

	}, 1000);
});
