import '../shared/Constants';
import { ARENA_SIZE, getSpeed } from '../shared/Constants';

/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");

const app = express();
const server = http.Server(app);
const io = socketIO(server, {
	pingTimeout: 60000,
});

app.set("port", 5000);
app.use("/", express.static("public"));
app.use("/assets", express.static("public/assets"));

app.get("/", function (request, response) {
	response.sendFile(path.join(__dirname, "../../public/index.html"));
});

server.listen(5000, function () {
	console.log("Starting server on port 5000");
});

const playerMap = new Map<string, Player>();
let playerList: Player[] = [];

io.on("connection", function (socket) {
	console.log("player [" + socket.id + "] connected");
	const player = new Player(socket.id, 20 + Math.random() * 1800, 20 + Math.random() * 1800, 0, getRandomColor());
	console.log(JSON.stringify(player));

	playerMap.set(socket.id, player);
	playerList.push(player);

	socket.emit("currentPlayers", playerList);
	socket.emit("currentFood", foodList);
	socket.broadcast.emit("newPlayer", player);

	socket.on("disconnect", function () {
		console.log("player [" + socket.id + "] disconnected");
		playerMap.delete(socket.id);
		playerList = playerList.filter((plr) => plr.playerId != socket.id);
		io.emit("playerDisconnected", socket.id);
	});

	socket.on("playerName", function (data) {
		console.log("got name", data.name);

		if (playerMap.get(socket.id)) {
			playerMap.get(socket.id).name = data.name;
		}
	});

	socket.on("playerMovement", function (movementData) {
		if (playerMap.get(socket.id)) {
			playerMap.get(socket.id).rotation = movementData.angle;
		}
	});
});

setInterval(() => {
	updateServer();
}, 1000 / 60);

function getRandomColor(): string {
	return "0x" + Math.floor(Math.random() * 16777215).toString(16);
}

let foodList: Food[] = [];

function updateServer() {
	playerList.forEach((player) => updatePlayer(player));
	foodList = foodList.filter((food) => food.id > 0);

	io.emit("playersUpdate", playerList);

	if (foodList.length < 150) {
		addFood();
	}
}

function addFood() {
	let food;
	let isColliding;
	let attempts = 0;

	do {
		isColliding = false;
		food = new Food(Math.random() * ARENA_SIZE, Math.random() * ARENA_SIZE);

		for (const player of playerList) {
			if (isPlayerCollidingWithFood(player, food)) {
				isColliding = true;
				break;
			}
		}

		attempts++;
	} while (isColliding && attempts < 100);
	
	foodList.push(food);
	io.emit("newFood", food);
}

function updatePlayer(player: Player) {
	const speed = getSpeed(player.size);
	player.x += Math.cos(player.rotation) * speed;
	player.y += Math.sin(player.rotation) * speed;

	keepInBounds(player);

	for (const food of foodList) {
		if (food.id !== -1 && isPlayerCollidingWithFood(player, food)) {
			player.size++;
			io.emit("foodEaten", food);
			food.id = -1;
		}
	}

	for (const otherPlayer of playerList) {
		if (otherPlayer.playerId !== player.playerId && isPlayerCollidingWithPlayer(player, otherPlayer)) {
			if (player.size > otherPlayer.size) {
				player.size += otherPlayer.size / 2;
				removePlayer(otherPlayer);
				io.emit("playerEaten", otherPlayer.playerId);
			} else {
				otherPlayer.size += player.size / 2;
				removePlayer(player);
				io.emit("playerEaten", player.playerId);
			}
		}
	}
}

function isPlayerCollidingWithFood(player: Player, food: Food): boolean {
	const distance = Math.sqrt(Math.pow(player.x - food.x, 2) + Math.pow(player.y - food.y, 2));
	return distance <= player.size + 3;
}

function isPlayerCollidingWithPlayer(player: Player, otherPlayer: Player): boolean {
	const distance = Math.sqrt(Math.pow(player.x - otherPlayer.x, 2) + Math.pow(player.y - otherPlayer.y, 2));
	return distance <= player.size + otherPlayer.size;
}

function removePlayer(player: Player) {
	playerList = playerList.filter(p => p.playerId !== player.playerId);
	playerMap.delete(player.playerId);
}

function keepInBounds(player: Player) {
	const minBound = player.size;
	const maxBound = ARENA_SIZE - player.size;

	player.x = Math.max(minBound, Math.min(player.x, maxBound));
	player.y = Math.max(minBound, Math.min(player.y, maxBound));
}

class Player {
	rotation: number;
	x: number;
	y: number;
	size: number;
	playerId: string;
	color: string;
	name: string;

	constructor(
		playerId: string,
		x: number,
		y: number,
		rotation: number,
		color: string
	) {
		this.playerId = playerId;
		this.x = x;
		this.y = y;
		this.rotation = rotation;
		this.color = color;
		this.size = 20;
	}
}

let foodCount = 0;
class Food {
	id: number;
	x: number;
	y: number;

	constructor(x: number, y: number) {
		foodCount++;
		this.id = foodCount;
		this.x = x;
		this.y = y;
	}
}
