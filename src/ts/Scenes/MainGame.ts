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
		netService.socket.emit("playerMovement", {
			angle: Math.atan2(
				this.input.mousePointer.y - 300,
				this.input.mousePointer.x - 400
			),
		});
		const currentPlayer = this.playerMap.get(netService.socket.id);
		if (currentPlayer !== undefined) {
			this.cameras.main.centerOn(currentPlayer.circle.x, currentPlayer.circle.y);
		}
	}

	public create(): void {
		Utilities.LogSceneMethodEntry("MainGame", "create");

		this.add
			.tileSprite(0, 0, 2000, 2000, "tiled")
			.setOrigin(0, 0);

		this.cameras.main.setZoom(0.5);

		netService.connect();

		netService.socket.on("connect", () => {
			console.log(netService.socket.connected); // true
			netService.socket.emit("playerName", {
				name: (this.game as Game).playerName,
			});
		});

		netService.socket.on("disconnect", () => {
			console.log(netService.socket.connected); // false
		});

		netService.socket.on("currentPlayers", (players: Player[]) => {
			players.forEach((player) => {
				const playerObj = new Player(
					this,
					player.playerId,
					player.rotation,
					player.x,
					player.y,
					player.color
				);
				this.playerList.push(playerObj);
				this.playerMap.set(player.playerId, playerObj);
			});
		});

		netService.socket.on("newPlayer", (player: Player) => {
			const playerObj = new Player(
				this,
				player.playerId,
				player.rotation,
				player.x,
				player.y,
				player.color
			);

			this.playerList.push(playerObj);
			this.playerMap.set(player.playerId, playerObj);
		});

		netService.socket.on("playerDisconnected", (playerId: string) => {
			this.playerList = this.playerList.filter((player) => {
				if (player.playerId === playerId) {
					this.playerMap.delete(player.playerId);
					player.circle.destroy();
				}
				return player.playerId !== playerId;
			});
		});

		netService.socket.on("playerEaten", (playerId: string) => {
			this.playerList = this.playerList.filter((player) => {
				if (player.playerId === playerId) {
					this.playerMap.delete(player.playerId);
					player.circle.destroy();
					player.circle2.destroy();
					player.text.destroy();
				}
				return player.playerId !== playerId;
			});
		});

		netService.socket.on("playersUpdate", (players: Player[]) => {
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

	constructor(
		scene: Phaser.Scene,
		playerId: string,
		rotation: number,
		x: number,
		y: number,
		color: number
	) {
		this.playerId = playerId;
		this.rotation = rotation;
		this.x = x;
		this.y = y;
		this.color = color;

		this.circle2 = scene.add.circle(this.x, this.y, this.size + 3, 0);
		this.circle = scene.add.circle(this.x, this.y, this.size, this.color);
		this.text = scene.add.text(this.x, this.y, "Player", {
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
		this.circle.setPosition(this.x, this.y);
		this.circle.setRadius(this.size);
		this.circle2.setPosition(this.x, this.y);
		this.circle2.setRadius(this.size + 3);
		this.text.setText(this.name);
		this.text.setPosition(this.x, this.y);
	}
}
