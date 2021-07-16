import { netService } from "../Services/NetService";
import Utilities from "../Utilities";

export default class MainGame extends Phaser.Scene {
	/**
	 * Unique name of the scene.
	 */
	public static Name = "MainGame";

	private playerList: Player[] = [];

	public preload(): void {
		// Preload as needed.
	}

	public create(): void {
		Utilities.LogSceneMethodEntry("MainGame", "create");

		netService.connect();

		netService.socket.emit('movement', {})

		netService.socket.on("connect", () => {
			console.log(netService.socket.connected); // true
		});

		netService.socket.on("disconnect", () => {
			console.log(netService.socket.connected); // false
		});

		netService.socket.on("currentPlayers", (players: Player[]) => {
			players.forEach(player => {
				this.playerList.push(player);
				player.circle = this.add.circle(player.x, player.y, 40, player.color);
			})
		});

		netService.socket.on("newPlayer", (player: Player) => {
			this.playerList.push(player);
			this.add.circle(player.x, player.y, 40, player.color);
		});

		netService.socket.on("playerDisconnected", (playerId: string) => {
			this.playerList = this.playerList.filter(player => {
				if (player.playerId === playerId) {
					player.circle.destroy();
				}
				return player.playerId !== playerId;
			});
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
}
