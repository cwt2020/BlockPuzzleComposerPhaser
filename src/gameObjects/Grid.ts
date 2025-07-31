import Phaser from 'phaser';

// Define an interface for the grid configuration for type safety
interface IGridConfig {
    scene: Phaser.Scene;
    x: number;
    y: number;
    width: number;
    height: number;
    cellSize: number;
}

export default class Grid extends Phaser.GameObjects.Group {
    private gridWidth: number;
    private gridHeight: number;
    private cellSize: number;

    constructor(config: IGridConfig) {
        // Call the parent constructor
        super(config.scene);

        this.gridWidth = config.width;
        this.gridHeight = config.height;
        this.cellSize = config.cellSize;

        // Add this group to the scene's display list
        config.scene.add.existing(this);

        this.createGrid(config.x, config.y);
    }

    /**
     * Creates and positions all the static sprites for the grid background.
     * @param x The top-left x coordinate of the grid.
     * @param y The top-left y coordinate of the grid.
     */
    private createGrid(x: number, y: number): void {
        for (let row = 0; row < this.gridHeight; row++) {
            for (let col = 0; col < this.gridWidth; col++) {
                // Calculate the position for each cell
                const cellX = x + col * this.cellSize + this.cellSize / 2;
                const cellY = y + row * this.cellSize + this.cellSize / 2;

                // Create a static image for the grid cell using the 'block' texture
                const cell = this.scene.add.image(cellX, cellY, 'block');

                // Scale the image to fit the cell size
                cell.setDisplaySize(this.cellSize, this.cellSize);

                // Tint the cell to make it look like a background grid
                cell.setTint(0x444444); 
                cell.setAlpha(0.5);

                // Add the cell to this group
                this.add(cell);
            }
        }

        // --- Create a border around the grid ---
        const borderWidth = 4; // The thickness of the border line
        const borderColor = 0xffffff; // The color of the border (white)
        const borderAlpha = 0.7; // The transparency of the border

        // Create a graphics object positioned at the top-left of the grid
        const graphics = this.scene.add.graphics({
            x: x,
            y: y
        });
        graphics.lineStyle(borderWidth, borderColor, borderAlpha);
        graphics.strokeRect(0, 0, this.gridWidth * this.cellSize, this.gridHeight * this.cellSize);
        this.add(graphics); // Add the border to the group
    }
}