/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express')
const http = require('http')
const path = require('path')
const socketIO = require('socket.io')

const app = express()
var server = http.Server(app)
var io = socketIO(server, {
	pingTimeout: 60000,
})

app.set('port', 5000)
app.use('/static', express.static(__dirname + '/static'))

app.get('/', function (request, response) {
	response.sendFile(path.join(__dirname, 'index.html'))
})

server.listen(5000, function () {
	console.log('Starting server on port 5000')
})

var playerMap = {}
var playerList = []

io.on('connection', function (socket) {
	console.log('player [' + socket.id + '] connected')
	let player = {
		rotation: 0,
		x: Math.random() * 500,
		y: Math.random() * 500,
		playerId: socket.id,
		color: getRandomColor()
	};
	playerMap[socket.id] = player
	playerList.push(player);

	socket.emit('currentPlayers', playerList)
	socket.broadcast.emit('newPlayer', player)
 
	socket.on('disconnect', function () {
		console.log('player [' + socket.id + '] disconnected')
		delete playerMap[socket.id]
		playerList = playerList.filter(plr => plr.playerId != socket.id)
		io.emit('playerDisconnected', socket.id)
	})

	socket.on('playerMovement', function (movementData) {
		// players[socket.id].x = movementData.x
		// players[socket.id].y = movementData.y
		// players[socket.id].rotation = movementData.rotation

		// socket.broadcast.emit('playerMoved', players[socket.id])
	})
})

function getRandomColor() {
	return '0x' + Math.floor(Math.random() * 16777215).toString(16)
}
