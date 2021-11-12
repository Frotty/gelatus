/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server, {
  pingTimeout: 60000
});

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(5000, function () {
  console.log('Starting server on port 5000');
});

const playerMap = new Map<string, Player>();
let playerList: Player[] = [];

io.on('connection', function (socket) {
  console.log('player [' + socket.id + '] connected');
  const player = new Player(socket.id, 0, Math.random() * 500, Math.random() * 500, getRandomColor());
  playerMap.set(socket.id, player);
  playerList.push(player);

  socket.emit('currentPlayers', playerList);
  socket.broadcast.emit('newPlayer', player);

  socket.on('disconnect', function () {
    console.log('player [' + socket.id + '] disconnected');
    playerMap.delete(socket.id);
    playerList = playerList.filter((plr) => plr.playerId != socket.id);
    io.emit('playerDisconnected', socket.id);
  });

  socket.on('playerMovement', function (movementData) {
    playerMap.get(socket.id).rotation = movementData.angle;
  });
});

setInterval(() => {
  updateServer();
}, 1000 / 60);

function getRandomColor(): string {
  return '0x' + Math.floor(Math.random() * 16777215).toString(16);
}

function updateServer() {
  playerList.forEach((player) => updatePlayer(player));
  io.emit('playersUpdate', playerList);
}

function updatePlayer(player) {
  player.x += Math.cos(player.rotation);
  player.y += Math.sin(player.rotation);
}

class Player {
  rotation: number;
  x: number;
  y: number;
  playerId: string;
  color: string;

  constructor(playerId: string, x: number, y: number, rotation: number, color: string) {
    this.playerId = playerId;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.color = color;
  }
}
