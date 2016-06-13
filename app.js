var express = require('express');
var app = express();
var serv = require('http').createServer(app);
var playerNumber = 1;
var totalPlayers = 0;
var world = 20;
//decide whether a round is over based on the timer or once all players have made a decision
//either timer or waitForPlayers
var decisionMode = "waitForPlayers";
//variables for timer
var TIME_LIMIT = 10;
var timer = TIME_LIMIT;
//variables for waitForPlayers
var decidedPlayers = 0;

app.get('/', function(req, res) {
	console.log(req.url);
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(3000, "0.0.0.0");
console.log('server started');
var SOCKET_LIST = {};

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
	socket.id = playerNumber;
	socket.timer = timer;
	SOCKET_LIST[socket.id] = socket;
	console.log('connection made');
	socket.emit('player', {
		number: socket.id
	});
	socket.world = world;
	socket.emit('world', {
		world: socket.world
	});
	socket.emit('timer', {
		timer: socket.timer
	});
	playerNumber++;
	totalPlayers++;
	console.log('totalPlayers: ' + totalPlayers);
	socket.on('decision4', function() {
		world += 2;
		checkPlayers(decisionMode);
		console.log('decidedPlayers: ' + decidedPlayers);
	});
});

if (decisionMode == "timer") {
	//increment the timer
	setInterval(function() {
		for(var i in SOCKET_LIST) {
			var socket = SOCKET_LIST[i];
			socket.timer = timer;
			socket.emit('timer', {
				timer: socket.timer
			});
		}
		timer--;
	}, 1000);

	//timer resets every TIMER_LIMIT seconds
	//show the updated data
	//enable output
	setInterval(function() {
		timer = TIME_LIMIT;
		for(var i in SOCKET_LIST) {
			var socket = SOCKET_LIST[i];
			socket.world = world;
			socket.emit('world', {
				world: socket.world
			});
			socket.emit('enable', {});
		}
	}, 1000 * TIME_LIMIT);
};

var checkPlayers = function(mode) {
	decidedPlayers++;
	if (mode == "waitForPlayers") {
		if (decidedPlayers == totalPlayers) {
			decidedPlayers = 0;
			for(var i in SOCKET_LIST) {
				var socket = SOCKET_LIST[i];
				socket.emit('world', {
					world: socket.world
				});
				socket.emit('enable', {});
			}
		}
	}
};