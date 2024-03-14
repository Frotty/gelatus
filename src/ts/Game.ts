import 'phaser';
import Boot from "./Scenes/Boot";
import Preloader from "./Scenes/Preloader";
import MainMenu from "./Scenes/MainMenu";
import SplashScreen from "./Scenes/SplashScreen";
import Utilities from "./Utilities";
import MainGame from "./Scenes/MainGame";
import MainSettings from "./Scenes/MainSettings";

const gameConfig: Phaser.Types.Core.GameConfig = {
	width: 800,
	height: 600,
	type: Phaser.AUTO,
	parent: "content",
	title: "Gelatus",
	fps: {
		target: 60,
		forceSetTimeOut: true,
	},
	scale: {
        mode: Phaser.Scale.RESIZE, // Resize the game to fill the whole window
        autoCenter: Phaser.Scale.CENTER_BOTH // Center the game horizontally and vertically
    },
};

export default class Game extends Phaser.Game {
	public playerName: string;

	constructor(config: Phaser.Types.Core.GameConfig, name: string) {
		Utilities.LogSceneMethodEntry("Game", "constructor");

		super(config);

		this.playerName = name;
		this.scene.add(Boot.Name, Boot);
		this.scene.add(Preloader.Name, Preloader);
		this.scene.add(SplashScreen.Name, SplashScreen);
		this.scene.add(MainMenu.Name, MainMenu);
		this.scene.add(MainGame.Name, MainGame);
		this.scene.add(MainSettings.Name, MainSettings);
		this.scene.start(Boot.Name);
	}
}

/**
 * Workaround for inability to scale in Phaser 3.
 * From http://www.emanueleferonato.com/2018/02/16/how-to-scale-your-html5-games-if-your-framework-does-not-feature-a-scale-manager-or-if-you-do-not-use-any-framework/
 */
function resize(): void {
	const canvas = document.querySelector("canvas");
	const width = window.innerWidth;
	const height = window.innerHeight;
	const wratio = width / height;
	const ratio = Number(gameConfig.width) / Number(gameConfig.height);
	if (wratio < ratio) {
		canvas.style.width = width + "px";
		canvas.style.height = (width / ratio) + "px";
	} else {
		canvas.style.width = (height * ratio) + "px";
		canvas.style.height = height + "px";
	}
}

window.onload = (): void => {
	const dialog = document.getElementById("nameDialog") as HTMLDialogElement;
	const startButton = document.getElementById("startButton");
	const playerNameInput = document.getElementById("playerName") as HTMLInputElement;

	if (typeof dialog.showModal === "function") {
		dialog.showModal();

		startButton?.addEventListener("click", () => {
		if (playerNameInput.value.trim() !== "") {
			dialog.close();
			new Game(gameConfig, playerNameInput.value);
		} else {
			alert("Please enter your name to start the game.");
		}
		});
	} else {
		// Fallback for browsers that don't support <dialog>
		alert("Your browser doesn't support HTML dialog elements. Please update your browser to play.");
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	
	// Uncomment the following two lines if you want the game to scale to fill the entire page, but keep the game ratio.
	// resize();
	// window.addEventListener("resize", resize, true);
};
