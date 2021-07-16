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
		// Preload as needed.
	}

	public update(time: number, delta: number): void {
		netService.socket.emit('playerMovement', { angle: Math.atan2(this.input.mousePointer.x - 400, this.input.mousePointer.y - 300) })
	}

	public create(): void {
		Utilities.LogSceneMethodEntry("MainGame", "create");

		netService.connect();


		netService.socket.on("connect", () => {
			console.log(netService.socket.connected); // true
		});

		netService.socket.on("disconnect", () => {
			console.log(netService.socket.connected); // false
		});

		netService.socket.on("currentPlayers", (players: Player[]) => {
			players.forEach(player => {
				const playerObj = new Player(player.playerId, player.rotation, player.x, player.y, player.color)
				playerObj.circle = this.add.circle(player.x, player.y, 40, player.color);
				this.playerList.push(playerObj);
				this.playerMap[player.playerId] = playerObj;
			})
		});

		netService.socket.on("newPlayer", (player: Player) => {
			const playerObj = new Player(player.playerId, player.rotation, player.x, player.y, player.color)
			playerObj.circle = this.add.circle(player.x, player.y, 40, player.color);
			this.playerList.push(playerObj);
			this.playerMap[player.playerId] = playerObj;
		});

		netService.socket.on("playerDisconnected", (playerId: string) => {
			this.playerList = this.playerList.filter(player => {
				if (player.playerId === playerId) {
					this.playerMap.delete(player.playerId);
					player.circle.destroy();
				}
				return player.playerId !== playerId;
			});
		});

		netService.socket.on("playersUpdate", (players: Player[]) => {
			players.forEach(player => {
				this.playerMap[player.playerId].update(player.x, player.y, player.rotation);
			})
		});
	}
}

class Player {
	playerId: string;
	rotation: number;
	x: number;
	y: number;
	color: number;
	circle: Phaser.GameObjects.Arc;

	constructor(playerId: string, rotation: number, x: number, y: number, color: number) {
		this.playerId = playerId;
		this.rotation = rotation;
		this.x = x;
		this.y = y;
		this.color = color;
	}

	update(x: number, y: number, rotation: number): void {
		this.x = x;
		this.y = y;
		this.rotation = rotation;
		this.circle.setPosition(x,y);
	}
}
