import Phaser from 'phaser';
import Grid from '../gameObjects/Grid';
import Shape from '../gameObjects/Shape';
import { rotateMatrixCW, flipMatrixHorizontal } from '../utils/matrixUtils';

export default class MainScene extends Phaser.Scene {
    private mainGridMatrix!: number[][];
    private placedBlocksMatrix: (Phaser.GameObjects.Rectangle | null)[][] = [];
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

        // The Grid object is purely visual. We create it and it adds itself to the scene.
        new Grid({
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

        // After creating the shape, check for a game over condition
        if (!this.canShapeBePlacedAnywhere(this.activeShape)) {
            this.triggerGameOver();
        }
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
        const buttonStyle = { fontSize: '42px', color: '#ffffff', backgroundColor: '#555555', padding: { x: 22, y: 8 } };
        const centerX = this.cameras.main.width / 2;

        // Rotate CW Button
        const rotateCWBtn = this.add.text(centerX - 180, buttonY, '↷', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.game.events.emit('rotateCWClicked');
                rotateCWBtn.setScale(0.95);
            })
            .on('pointerup', () => rotateCWBtn.setScale(1));

        // Flip Button
        const flipBtn = this.add.text(centerX, buttonY, '↔', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.game.events.emit('flipClicked');
                flipBtn.setScale(0.95);
            })
            .on('pointerup', () => flipBtn.setScale(1));

        // Rotate CCW Button
        const rotateCCWBtn = this.add.text(centerX + 180, buttonY, '↶', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.game.events.emit('rotateCCWClicked');
                rotateCCWBtn.setScale(0.95);
            })
            .on('pointerup', () => rotateCCWBtn.setScale(1));
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

                const block = this.add.rectangle(
                    this.gridX + cell.x * this.CELL_SIZE + (this.CELL_SIZE / 2),
                    this.gridY + cell.y * this.CELL_SIZE + (this.CELL_SIZE / 2),
                    this.CELL_SIZE,
                    this.CELL_SIZE,
                    shape.color
                );
                block.setStrokeStyle(1, 0x000000, 0.5);
                // Rectangles default to a 0.5, 0.5 origin, so positioning them
                // at the center of the grid cell is correct.

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
            this.time.delayedCall(500, this.endPhase, [], this);
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
        this.time.delayedCall(500, this.endPhase, [], this);
    }

    private endPhase(): void {
        console.log("Phase complete. Returning to BuildScene.");
        // Save the current grid state for the hint feature
        this.game.registry.set('mainGridMatrix', this.mainGridMatrix);
        // Restart the build scene to complete the loop
        this.scene.switch('BuildScene');
    }

    // --- Game Over Logic ---

    private triggerGameOver(): void {
        console.log("GAME OVER");
        if (this.activeShape) {
            this.activeShape.disableInteractive();
        }

        // Dim the screen
        this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.7
        ).setDepth(100);

        // Game Over Text
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, 'GAME OVER', {
            fontSize: '128px', color: '#ff4444',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(101);

        // Restart Button
        const restartBtn = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 100, 'Restart', {
            fontSize: '64px', color: '#ffffff', backgroundColor: '#555555', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => {
            // Explicitly reset the score and notify the UI Scene before restarting.
            this.score = 0;
            this.game.events.emit('updateScore', this.score);

            // Clear the main grid for the hint
            const GRID_WIDTH = 11;
            const GRID_HEIGHT = 11;
            const emptyGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0));
            this.game.registry.set('mainGridMatrix', emptyGrid);

            // Restart the BuildScene to ensure it's in a fresh state.
            this.scene.get('BuildScene').scene.restart();
            // Use `start` to shut down the current MainScene completely, destroying the
            // game over screen and ensuring a fresh start when it's next launched.
            this.scene.start('BuildScene');
        });
    }

    private canShapeBePlacedAnywhere(shape: Shape): boolean {
        let currentMatrix = shape.matrix;

        // Check all 4 rotations
        for (let i = 0; i < 4; i++) {
            // Check the normal and flipped versions of the current rotation
            if (this.canMatrixBePlaced(currentMatrix) || this.canMatrixBePlaced(flipMatrixHorizontal(currentMatrix))) {
                return true; // Found a valid placement
            }
            currentMatrix = rotateMatrixCW(currentMatrix);
        }

        return false; // No valid placements found for any orientation
    }

    private canMatrixBePlaced(matrix: number[][]): boolean {
        // Iterate through every cell of the grid as a potential top-left anchor for the matrix
        for (let r = -matrix.length + 1; r < this.GRID_HEIGHT; r++) {
            for (let c = -matrix[0].length + 1; c < this.GRID_WIDTH; c++) {
                if (this.canPlaceMatrixAt(matrix, c, r)) {
                    return true;
                }
            }
        }
        return false;
    }

    private canPlaceMatrixAt(matrix: number[][], gridCol: number, gridRow: number): boolean {
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
                if (matrix[r][c] === 1) {
                    const targetRow = gridRow + r;
                    const targetCol = gridCol + c;

                    // Check if the block is out of bounds OR if the cell is occupied
                    if (targetRow < 0 || targetRow >= this.GRID_HEIGHT ||
                        targetCol < 0 || targetCol >= this.GRID_WIDTH ||
                        this.mainGridMatrix[targetRow][targetCol] === 1) {
                        return false; // This one block is invalid, so this position is invalid
                    }
                }
            }
        }
        return true; // All blocks in the matrix fit at this position
    }
}