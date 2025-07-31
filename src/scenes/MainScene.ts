import Phaser from 'phaser';
import Grid from '../gameObjects/Grid';
import Shape from '../gameObjects/Shape';

export default class MainScene extends Phaser.Scene {
    private mainGridObject!: Grid;
    private mainGridMatrix!: number[][];
    private placedBlocksMatrix: (Phaser.GameObjects.Image | null)[][] = [];
    private previewGraphics!: Phaser.GameObjects.Graphics;
    private activeShape!: Shape;
    private superShapeMatrix!: number[][];
    private score: number = 0;

    // --- Grid Properties ---
    private readonly GRID_WIDTH = 11;
    private readonly GRID_HEIGHT = 11;
    private readonly CELL_SIZE = 72;
    private gridX = 0;
    private gridY = 0;

    constructor() {
        super({ key: 'MainScene' });
    }

    init(data: { superShapeData: number[][] }) {
        this.superShapeMatrix = data.superShapeData || [[1]];
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c3e50');
        this.initMainGrid();
        this.createActiveShape();
        this.previewGraphics = this.add.graphics();
        this.createControlButtons();
        this.setupInputHandling();
        this.events.on(Phaser.Scenes.Events.WAKE, this.onWake, this);

        this.add.text(this.cameras.main.centerX, 60, 'Place the Shape', {
            fontSize: '56px', color: '#ffffff'
        }).setOrigin(0.5);
    }

    private initMainGrid(): void {
        this.gridX = (this.cameras.main.width - (this.GRID_WIDTH * this.CELL_SIZE)) / 2;
        this.gridY = 120;

        this.mainGridObject = new Grid({
            scene: this, x: this.gridX, y: this.gridY,
            width: this.GRID_WIDTH, height: this.GRID_HEIGHT, cellSize: this.CELL_SIZE
        });

        // Initialize the logical grid for tracking placed blocks
        this.mainGridMatrix = Array.from({ length: this.GRID_HEIGHT }, () => Array(this.GRID_WIDTH).fill(0));
        this.placedBlocksMatrix = Array.from({ length: this.GRID_HEIGHT }, () => Array(this.GRID_WIDTH).fill(null));
    }

    private createActiveShape(): void {
        const gridBottom = this.gridY + (this.GRID_HEIGHT * this.CELL_SIZE);
        const startAreaY = gridBottom + 300; // Position it below the grid

        this.activeShape = new Shape({
            scene: this,
            x: this.cameras.main.width / 2,
            y: startAreaY,
            matrix: this.superShapeMatrix,
            cellSize: this.CELL_SIZE,
            color: 0xffa500
        });

        this.activeShape.startX = this.activeShape.x;
        this.activeShape.startY = this.activeShape.y;

        // --- Listen for events from the active shape ---
        this.activeShape.on('dragging', (shape: Shape) => {
            this.updateDropPreview(shape);
        });

        this.activeShape.on('dropped', (shape: Shape) => {
            this.previewGraphics.clear();
            this.handleShapeDrop(shape);
        });

        // Listen for transformations to update the preview, even when not dragging
        this.activeShape.on('transformed', (shape: Shape) => {
            this.updateDropPreview(shape);
        });
    }

    private onWake(): void {
        const superShapeData = this.game.registry.get('superShapeData');
        if (superShapeData) {
            if (this.activeShape) { this.activeShape.destroy(); }
            this.superShapeMatrix = superShapeData;
            this.createActiveShape();
            // Clean up the registry to prevent using stale data on next wake
            this.game.registry.remove('superShapeData');
        }
    }

    private setupInputHandling(): void {
        // --- Connect UI events to the active shape ---
        this.game.events.on('rotateCWClicked', () => this.activeShape.rotateCW());
        this.game.events.on('rotateCCWClicked', () => this.activeShape.rotateCCW());
        this.game.events.on('flipClicked', () => this.activeShape.flip());
        
        // --- Cleanup listeners ---
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.game.events.off('rotateCWClicked');
            this.game.events.off('rotateCCWClicked');
            this.game.events.off('flipClicked');
            this.events.off(Phaser.Scenes.Events.WAKE, this.onWake, this)
        });
    }

    private createControlButtons(): void {
        // Position buttons below the shape's starting area
        const buttonY = this.activeShape.startY + 300; 
        const buttonStyle = { fontSize: '32px', color: '#ffffff', backgroundColor: '#555555', padding: { x: 10, y: 5 } };
        const centerX = this.cameras.main.width / 2;

        // Rotate CW Button
        const rotateCWBtn = this.add.text(centerX - 150, buttonY, '↻', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.game.events.emit('rotateCWClicked');
                rotateCWBtn.setScale(0.95);
            })
            .on('pointerup', () => rotateCWBtn.setScale(1));

        // Rotate CCW Button
        const rotateCCWBtn = this.add.text(centerX + 150, buttonY, '↺', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.game.events.emit('rotateCCWClicked');
                rotateCCWBtn.setScale(0.95);
            })
            .on('pointerup', () => rotateCCWBtn.setScale(1));

        // Flip Button
        const flipBtn = this.add.text(centerX, buttonY, '↔', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { this.game.events.emit('flipClicked'); flipBtn.setScale(0.95); })
            .on('pointerup', () => flipBtn.setScale(1));
    }

    private handleShapeDrop(shape: Shape): void {
        const { cells: occupiedCells } = shape.getProjectedGridInfo(this.gridX, this.gridY, this.CELL_SIZE);

        const canPlace = occupiedCells.every(cell =>
            cell.x >= 0 && cell.x < this.GRID_WIDTH &&
            cell.y >= 0 && cell.y < this.GRID_HEIGHT &&
            this.mainGridMatrix[cell.y][cell.x] === 0
        );

        if (canPlace) {
            // Lock it in the logical and visual grids
            occupiedCells.forEach(cell => {
                this.mainGridMatrix[cell.y][cell.x] = 1;

                const block = this.add.image(
                    this.gridX + cell.x * this.CELL_SIZE,
                    this.gridY + cell.y * this.CELL_SIZE,
                    'block'
                )
                .setOrigin(0, 0)
                .setDisplaySize(this.CELL_SIZE, this.CELL_SIZE)
                .setTint(shape.color); // Use the new color getter

                this.placedBlocksMatrix[cell.y][cell.x] = block;
            });

            // The active shape's blocks have been copied, so destroy the container
            shape.destroy();
            this.checkForClears();
        } else {
            shape.returnToStart(); // Or snap back to last valid position
        }
    }

    private updateDropPreview(shape: Shape): void {
        this.previewGraphics.clear();

        const { cells: occupiedCells } = shape.getProjectedGridInfo(this.gridX, this.gridY, this.CELL_SIZE);

        const canPlace = occupiedCells.every(cell =>
            cell.x >= 0 && cell.x < this.GRID_WIDTH &&
            cell.y >= 0 && cell.y < this.GRID_HEIGHT &&
            this.mainGridMatrix[cell.y][cell.x] === 0
        );

        const previewColor = canPlace ? 0x44ff44 : 0xff4444; // Green for valid, Red for invalid
        this.previewGraphics.fillStyle(previewColor, 0.5);

        occupiedCells.forEach(cell => {
            if (cell.x >= 0 && cell.x < this.GRID_WIDTH && cell.y >= 0 && cell.y < this.GRID_HEIGHT) {
                const x = this.gridX + cell.x * this.CELL_SIZE;
                const y = this.gridY + cell.y * this.CELL_SIZE;
                this.previewGraphics.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
            }
        });
    }

    private checkForClears(): void {
        const linesToClear: number[] = [];
        for (let r = 0; r < this.GRID_HEIGHT; r++) {
            if (this.mainGridMatrix[r].every(cell => cell === 1)) {
                linesToClear.push(r);
            }
        }
        const columnsToClear: number[] = [];
        for (let c = 0; c < this.GRID_WIDTH; c++) {
            let isFull = true;
            for (let r = 0; r < this.GRID_HEIGHT; r++) {
                if (this.mainGridMatrix[r][c] === 0) {
                    isFull = false;
                    break;
                }
            }
            if (isFull) {
                columnsToClear.push(c);
            }
        }

        if (linesToClear.length > 0 || columnsToClear.length > 0) {
            this.clearLinesAndColumns(linesToClear, columnsToClear);
        } else {
            // End the phase after a short delay user to study
            this.time.delayedCall(2000, this.endPhase, [], this);
        }
    }

    private clearLinesAndColumns(lines: number[], columns: number[]): void {
        // --- Scoring ---
        const totalClears = lines.length + columns.length;
        const baseScore = 100;
        const comboBonus = 50;
        this.score += (baseScore * totalClears) + (comboBonus * (totalClears > 1 ? totalClears - 1 : 0));
        this.game.events.emit('updateScore', this.score);

        // --- Update Models and Visuals ---
        // Clear full rows
        lines.forEach(row => {
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                if (this.placedBlocksMatrix[row][col]) {
                    this.placedBlocksMatrix[row][col]!.destroy();
                    this.placedBlocksMatrix[row][col] = null;
                }                
                this.mainGridMatrix[row][col] = 0;
            }
        });

        // Clear full columns
        columns.forEach(col => {
            for (let row = 0; row < this.GRID_HEIGHT; row++) {
                // The block might have been already destroyed if it was in a cleared row
                if (this.placedBlocksMatrix[row][col]) {
                    this.placedBlocksMatrix[row][col]!.destroy();
                    this.placedBlocksMatrix[row][col] = null;
                }
                this.mainGridMatrix[row][col] = 0;
            }
        });

        // End the phase after a short delay for the visual effect
        this.time.delayedCall(2000, this.endPhase, [], this);
    }

    private endPhase(): void {
        console.log("Phase complete. Returning to BuildScene.");
        // Restart the build scene to complete the loop
        this.scene.switch('BuildScene');
    }
}