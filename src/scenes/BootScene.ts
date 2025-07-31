import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Launch the scenes that will run concurrently
        this.scene.launch('UIScene');
        this.scene.launch('BuildScene');

        // Stop the boot scene as it's no longer needed
        this.scene.stop('BootScene');
    }
}