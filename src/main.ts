import Phaser from 'phaser';
import './style.css';import MainScene from './scenes/MainScene'; // Assuming you have a MainScene
import BuildScene from './scenes/BuildScene';
import UIScene from './scenes/UIScene';
import BootScene from './scenes/BootScene';

/**
 * The main configuration for the Phaser game instance.
 */
const config: Phaser.Types.Core.GameConfig = {
    // Use WebGL with a fallback to Canvas
    type: Phaser.AUTO,

    // The parent element ID from your index.html
    parent: 'game-container',

    // Base resolution of your game
    width: 1080,  // Swapped to a portrait aspect ratio (9:16) common for mobile
    height: 1920,

    // --- SCENE CONFIGURATION ---
    scene: [
        BootScene,
        MainScene,
        UIScene,
        BuildScene
    ],

    // --- SCALE MANAGER CONFIGURATION ---
    scale: {
        // This mode scales the game to fit within the parent container,
        // preserving the aspect ratio (may result in letterboxing).
        mode: Phaser.Scale.FIT,

        // This centers the game canvas horizontally and vertically within the parent.
        autoCenter: Phaser.Scale.CENTER_BOTH,

        // Minimum and maximum dimensions for the canvas
        min: { width: 450, height: 800 },   // Portrait min dimensions
        max: { width: 1080, height: 1920 }  // Portrait max dimensions (FHD)
    },
};

export default new Phaser.Game(config);