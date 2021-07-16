import { netService } from "../Services/NetService";
import Utilities from "../Utilities";

export default class MainGame extends Phaser.Scene {
	/**
	 * Unique name of the scene.
	 */
	public static Name = "MainGame";

	private playerList = [];

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

		netService.socket.on("currentPlayers", (players: any[]) => {
			players.forEach(player => {
				this.playerList.push(player);
				this.add.circle(player.x, player.y, 40, player.color);
			})
		});


	}
}
