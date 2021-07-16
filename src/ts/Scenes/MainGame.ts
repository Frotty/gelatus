import { netService } from "../Services/NetService";
import Utilities from "../Utilities";

export default class MainGame extends Phaser.Scene {
	/**
	 * Unique name of the scene.
	 */
	public static Name = "MainGame";

	public preload(): void {
		// Preload as needed.
	}

	public create(): void {
		Utilities.LogSceneMethodEntry("MainGame", "create");

		netService.connect();

		netService.socket.on("connect", () => {
			console.log(this.socket.connected); // true
		});

		netService.socket.on("disconnect", () => {
			console.log(this.socket.connected); // false
		});

		this.add.circle(100, 100, 40, 0xffbbcc);
	}
}
