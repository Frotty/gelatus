import Game from "../Game";
import { netService } from "../Services/NetService";
import Utilities from "../Utilities";

export default class MainGame extends Phaser.Scene {
	/**
	 * Unique name of the scene.
	 */
	public static Name = "MainGame";

	private playerList: Player[] = [];

	private playerMap: Map<string, Player> = new Map();

	public preload(): void {
		this.load.image("tiled", "assets/tiled.jpg");
	}

	public update(time: number, delta: number): void {
		const angle = Math.atan2(
				this.input.mousePointer.y - 300,
				this.input.mousePointer.x - 400
			);
		
		const currentPlayer = this.playerMap.get(netService.socket.id);
		this.playerList.forEach((player) => {
			if (player !== undefined) {
				const minBound = player.size;
				const maxBound = 2000 - player.size;
				const speed = Math.max(1, 6 - (3 * player.size) / 200);
				const rotation = player == currentPlayer ? angle : player.rotation;
				const movementX = Math.cos(rotation) * speed;
				const movementY = Math.sin(rotation) * speed;
				const newX = Math.min(Math.max(player.circle.x + movementX, minBound), maxBound);
				const newY = Math.min(Math.max(player.circle.y + movementY, minBound), maxBound);
				console.log("delta " + delta + " predicted pos:" + newX + " " + newY + " real pos:" + player.x + " " + player.y);

				// Interpolate between server position and display position
				const interpolationFactor = 0.1; // Adjust this value to control the smoothness of interpolation
				const interpolatedX = newX + (player.x - newX) * interpolationFactor;
				const interpolatedY = newY + (player.y - newY) * interpolationFactor;

				player.circle.setPosition(interpolatedX, interpolatedY);
				player.circle2.setPosition(interpolatedX, interpolatedY);
				player.text.setPosition(interpolatedX, interpolatedY);
			}
		});
		if (currentPlayer != undefined) {
			this.cameras.main.centerOn(currentPlayer.circle.x, currentPlayer.circle.y);
			const minZoom = 0.001;
			const maxZoom = 1;
			const minPlayerSize = 10; // Minimum player size
			const maxPlayerSize = 1000; // Maximum player size you expect
			const scale = Math.log(currentPlayer.size / minPlayerSize) / Math.log(maxPlayerSize / minPlayerSize);

			// Calculate current zoom level
			const zoom = maxZoom - scale * (maxZoom - minZoom);

			// Ensure the zoom level is within the desired range
			const zoomInBounds = Math.max(minZoom, Math.min(zoom, maxZoom));

			// Interpolate between current zoom level and desired zoom level
			const interpolationFactor = 0.1; // Adjust this value to control the smoothness of interpolation
			const interpolatedZoom = this.cameras.main.zoom + (zoomInBounds - this.cameras.main.zoom) * interpolationFactor;

			this.cameras.main.setZoom(interpolatedZoom);
		} 
		netService.socket.emit("playerMovement", {
			angle: angle,
		});
	}

	public create(): void {
		Utilities.LogSceneMethodEntry("MainGame", "create");

		this.add
			.tileSprite(0, 0, 2000, 2000, "tiled")
			.setOrigin(0, 0);

		this.cameras.main.setZoom(0.75);

		netService.connect();

		netService.socket.on("connect", () => {
			console.log(netService.socket.connected); // true
			netService.socket.emit("playerName", {
				name: (this.game as Game).playerName,
			});

			// Clean up existing data
			this.playerList.forEach((player) => {
				player.destroy();
			});
			this.playerList = [];
			this.playerMap.clear();
			foodMap.forEach((food) => {
				food.circle.destroy();
			});
			foodMap.clear();
		});

		netService.socket.on("disconnect", () => {
			console.log(netService.socket.connected); // false
		});

		netService.socket.on("currentPlayers", (serverPlayers: Player[]) => {
			console.log("currentPlayers", serverPlayers);
			
			serverPlayers.forEach((serverPlayer) => {
				const playerObj = new Player(this, serverPlayer);
				this.playerList.push(playerObj);
				this.playerMap.set(serverPlayer.playerId, playerObj);
			});
		});

		netService.socket.on("newPlayer", (serverPlayer: Player) => {
			console.log("newPlayer", serverPlayer);
			
			const playerObj = new Player(this, serverPlayer);

			this.playerList.push(playerObj);
			this.playerMap.set(serverPlayer.playerId, playerObj);
		});

		netService.socket.on("playerDisconnected", (playerId: string) => {
			this.playerList = this.playerList.filter((player) => {
				if (player.playerId === playerId) {
					this.playerMap.delete(player.playerId);
					player.destroy();
				}
				return player.playerId !== playerId;
			});
		});

		netService.socket.on("playerEaten", (playerId: string) => {
			this.playerList = this.playerList.filter((player) => {
				if (player.playerId === playerId) {
					this.playerMap.delete(player.playerId);
					player.destroy();
				}
				return player.playerId !== playerId;
			});
		});

		netService.socket.on("playersUpdate", (players: Player[]) => {
			// console.log("playersUpdate", players);
			
			players.forEach((player) => {
				this.playerMap.get(player.playerId).update(player);
			});
		});

		netService.socket.on("newFood", (food: Food) => {
			new Food(this, food.id, food.x, food.y);
		});

		netService.socket.on("currentFood", (foods: Food[]) => {
			for(const food of foods) {
				new Food(this, food.id, food.x, food.y);
			}
		});

		netService.socket.on("foodEaten", (food: Food) => {
			foodMap.get(food.id).circle.destroy();
			foodMap.delete(food.id);
		});
	}
}

class Food {
	id: number;
	x: number;
	y: number;
	circle: Phaser.GameObjects.Arc;

	constructor(scene: Phaser.Scene, id: number, x: number, y: number) {
		this.x = x;
		this.y = y;
		this.id = id;
		this.circle = scene.add.circle(x, y, 5, parseInt("AAFF00", 16));
		foodMap.set(id, this);
	}
}

const foodMap = new Map<number, Food>();

class Player {
  playerId: string;
  rotation: number;
  x: number;
  y: number;
  size: number;
  color: number;
  name: string;
  circle: Phaser.GameObjects.Arc;
  circle2: Phaser.GameObjects.Arc;
  text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, serverPlayer: Player) {
    this.playerId = serverPlayer.playerId;
    this.rotation = serverPlayer.rotation;
    this.x = serverPlayer.x;
    this.y = serverPlayer.y;
    this.color = serverPlayer.color;
    this.size = serverPlayer.size;

    this.circle2 = scene.add.circle(this.x, this.y, this.size + 3, 0);
    this.circle = scene.add.circle(this.x, this.y, this.size, this.color);
    this.text = scene.add.text(this.x, this.y, serverPlayer.name, {
      font: "40px Arial",
      color: "red",
    });
    this.text.setOrigin(0.5, 0.5);
  }

  update(updatedPlayer: Player): void {
    this.x = updatedPlayer.x;
    this.y = updatedPlayer.y;
    this.rotation = updatedPlayer.rotation;
    this.size = updatedPlayer.size;
    this.name = updatedPlayer.name;
    this.circle.setRadius(this.size);
    this.circle2.setRadius(this.size + 3);
    this.text.setText(this.name);
    // this.circle.setPosition(this.x, this.y);
    // this.circle2.setPosition(this.x, this.y);
    // this.text.setPosition(this.x, this.y);
  }

  destroy(): void {
    this.circle.destroy();
    this.circle2.destroy();
    this.text.destroy();
  }
}
