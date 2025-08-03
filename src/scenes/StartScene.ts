import Phaser from 'phaser';

export default class StartScene extends Phaser.Scene {

    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        const startButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Start Game', {
            fontSize: '64px', color: '#000000', backgroundColor: '#ffffff', padding: { x: 30, y: 20 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            if (this.sys.game.device.input.touch) {
                this.scale.startFullscreen();
            }
            this.scene.start('BuildScene');
            this.scene.launch('UIScene');
        });
    }
}