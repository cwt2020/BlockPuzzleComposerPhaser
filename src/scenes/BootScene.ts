import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    private gameStarted = false;

    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        if (!this.gameStarted) {
            this.startGame();
            this.gameStarted = true;
        }
    }

    private startGame(): void {
        // First time starting
        const GRID_WIDTH = 11;
        const GRID_HEIGHT = 11;
        const emptyGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0));
        this.game.registry.set('mainGridMatrix', emptyGrid);

        this.scene.start('BuildScene');
        this.scene.launch('UIScene');
    }

    private resumeGame(): void {
        if (this.scene.isPaused('MainScene')) {
            this.scene.resume('MainScene');
            this.scene.resume('UIScene');
        } else if (this.scene.isPaused('BuildScene')) {
            this.scene.resume('BuildScene');
            this.scene.resume('UIScene');
        }
    }
}