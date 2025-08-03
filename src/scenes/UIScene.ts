import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    private pointerDebugText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'UIScene' });
    }
    
    create() {
        // --- Score Display ---
        this.scoreText = this.add.text(20, 40, 'Score: 0', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        
        // --- Event Listener for Score ---
        this.game.events.on('updateScore', (score: number) => {
            this.scoreText.setText(`Score: ${score}`);
        });

        // --- Pointer Position Display for Debugging ---

        // Style for the debug text to make it readable against any background
        const style: Phaser.Types.GameObjects.Text.TextStyle = {
            color: '#00ff00', // A bright green color
            fontSize: '24px',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        };

        // Create the text object in the top-left corner.
        this.pointerDebugText = this.add.text(10, 10, 'Pointer: (0, 0)', style);

        // Set its depth to be on top of everything else in this scene
        this.pointerDebugText.setDepth(100);
    }

    update() {
        // --- Update Pointer Position Display ---
        const pointer = this.input.activePointer;

        // We use pointer.worldX and pointer.worldY to get the coordinates
        // within the game world. This is crucial as it accounts for any
        // camera scrolling or zooming you might have in your MainScene.
        const worldX = Math.floor(pointer.worldX);
        const worldY = Math.floor(pointer.worldY);
    
        this.pointerDebugText.setText(`Pointer: (${worldX}, ${worldY})`);
    }
}
