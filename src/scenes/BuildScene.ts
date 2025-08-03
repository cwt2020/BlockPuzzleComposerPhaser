import Phaser from 'phaser';
import Grid from '../gameObjects/Grid';
import Shape from '../gameObjects/Shape';
import ShapeFactory from '../managers/ShapeFactory';
import { trimMatrix } from '../utils/matrixUtils'; 

export default class BuildScene extends Phaser.Scene {
    private buildGridMatrix!: number[][]; // Logical grid
    private sourceShapes: Shape[] = [];
    private shapeFactory!: ShapeFactory;
    private previewGraphics!: Phaser.GameObjects.Graphics;
    private hintPreviewGraphics!: Phaser.GameObjects.Graphics;

    // Grid properties
    private readonly GRID_WIDTH = 7;
    private readonly GRID_HEIGHT = 7;
    private readonly CELL_SIZE = 80;
    private gridX = 0;
    private gridY = 0;

    constructor() {
        super({ key: 'BuildScene' });
    }

    create() {
        // This method is called only once when the scene is first created.
        this.events.on(Phaser.Scenes.Events.WAKE, this.resetScene, this);
        this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.events.off(Phaser.Scenes.Events.WAKE, this.resetScene, this);
        });

        this.resetScene();
    }

    private resetScene(): void {
        // This method is called on initial creation and every time the scene is woken up.
        this.sourceShapes.forEach(s => s.destroy());
        this.sourceShapes = [];
        this.children.removeAll();
        this.shapeFactory = new ShapeFactory();
        this.initBuildGrid();
        this.previewGraphics = this.add.graphics(); // Create preview layer on top of the grid
        this.hintPreviewGraphics = this.add.graphics().setDepth(10); // For hint preview
        this.generateSourceShapes();
        this.createHintButton();
        this.add.text(this.cameras.main.centerX, 80, 'Compose Your Shape', {
            fontSize: '56px', color: '#ffffff'
        }).setOrigin(0.5);
    }

    private initBuildGrid(): void {
        this.gridX = Math.floor((this.cameras.main.width - (this.GRID_WIDTH * this.CELL_SIZE)) / 2);
        this.gridY = 200;
        new Grid({
            scene: this, x: this.gridX, y: this.gridY,
            width: this.GRID_WIDTH, height: this.GRID_HEIGHT, cellSize: this.CELL_SIZE
        });
        this.buildGridMatrix = Array.from({ length: this.GRID_HEIGHT }, () => Array(this.GRID_WIDTH).fill(0));
    }

    private generateSourceShapes(): void {
        // --- Layout Configuration ---
        const gridBottom = this.gridY + (this.GRID_HEIGHT * this.CELL_SIZE);
        const spacingBelowGrid = 220;
        const maxShapeHeight = 3 * this.CELL_SIZE; // Max possible height of a generated shape (from ShapeFactory)
        const spacingBelowShapes = 40;

        const shapeSlotY = gridBottom + spacingBelowGrid;
        const buttonY = shapeSlotY + maxShapeHeight + spacingBelowShapes;
        
        const slotSpacing = Math.floor(this.cameras.main.width / 4);

        for (let i = 0; i < 3; i++) {
            const matrix = this.shapeFactory.generateShapeMatrix(2, 6, 3);
            const shapeX = Math.floor(slotSpacing * (i + 1));
            
            const shape = new Shape({
                scene: this,
                x: shapeX,
                y: shapeSlotY,
                matrix: matrix,
                cellSize: this.CELL_SIZE,
                color: 0x00dddd
            });
            
            this.sourceShapes.push(shape);

            // --- Set up event listeners for this specific shape ---
            shape.on('dragging', (draggedShape: Shape) => {
                if (!draggedShape.isPlaced) {
                    this.updateDropPreview(draggedShape);
                    this.children.bringToTop(this.previewGraphics);
                }
            });

            shape.on('dropped', (droppedShape: Shape) => {
                this.previewGraphics.clear();
                this.handleShapeDrop(droppedShape);
            });

            this.createShapeButtons(shape, shapeX, buttonY);
        }
    }

    private createShapeButtons(shape: Shape, centerX: number, y: number): void {
        const buttonHorizontalSpacing = 80;
        const buttonStyle = { fontSize: '48px', color: '#ffffff', backgroundColor: '#555555', padding: { x: 22, y: 8 }, align: 'center' };

        // Rotate CCW Button (↶)
        this.add.text(centerX + buttonHorizontalSpacing, y, '↶', buttonStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => shape.rotateCCW());
        // Rotate CW Button (↷)
        this.add.text(centerX - buttonHorizontalSpacing, y, '↷', buttonStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => shape.rotateCW());
        // Flip Button (⇔)
        this.add.text(centerX , y, '↔', buttonStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => shape.flip());
    }

    private handleShapeDrop(shape: Shape): void {
        const { col, row, cells: occupiedCells } = shape.getProjectedGridInfo(this.gridX, this.gridY, this.CELL_SIZE);

        const canPlace = occupiedCells.every(cell =>
            cell.x >= 0 && cell.x < this.GRID_WIDTH &&
            cell.y >= 0 && cell.y < this.GRID_HEIGHT &&
            this.buildGridMatrix[cell.y][cell.x] === 0
        );

        if (canPlace) {
            occupiedCells.forEach(cell => {
                this.buildGridMatrix[cell.y][cell.x] = 1;
            });

            shape.snapToGrid(this.gridX, this.gridY, this.CELL_SIZE, col, row);
            shape.place();

            // If all shapes have been placed, automatically proceed to the next scene.
            if (this.sourceShapes.every(s => s.isPlaced)) {                
                this.time.delayedCall(250, this.confirmComposition, [], this);
            }
        } else {
            shape.returnToStart();
        }
    }

    private updateDropPreview(shape: Shape): void {
        this.previewGraphics.clear();

        const { cells: occupiedCells } = shape.getProjectedGridInfo(this.gridX, this.gridY, this.CELL_SIZE);

        const canPlace = occupiedCells.every(cell =>
            cell.x >= 0 && cell.x < this.GRID_WIDTH &&
            cell.y >= 0 && cell.y < this.GRID_HEIGHT &&
            this.buildGridMatrix[cell.y][cell.x] === 0
        );

        const previewColor = canPlace ? 0x44ff44 : 0xff4444; // Green for valid, Red for invalid
        this.previewGraphics.fillStyle(previewColor, 0.5); // Semi-transparent

        occupiedCells.forEach(cell => {
            // Only draw preview cells that are within the grid bounds
            if (cell.x >= 0 && cell.x < this.GRID_WIDTH && cell.y >= 0 && cell.y < this.GRID_HEIGHT) {
                const x = this.gridX + cell.x * this.CELL_SIZE;
                const y = this.gridY + cell.y * this.CELL_SIZE;
                this.previewGraphics.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
            }
        });
    }

    private confirmComposition(): void {
        console.log("Composition confirmed! Generating super-shape...");
        const superShapeData = trimMatrix(this.buildGridMatrix);
        const mainScene = this.scene.get('MainScene');

        // If MainScene is sleeping, wake it up by switching. Otherwise, start it for the first time.
        if (mainScene && mainScene.sys.isSleeping()) {
            this.game.registry.set('superShapeData', superShapeData);
            this.scene.switch('MainScene');
        } else {
            this.scene.start('MainScene', { superShapeData: superShapeData });
        }
    }

    private createHintButton(): void {
        const hintButton = this.add.text(this.cameras.main.width - 100, 60, 'Hint', {
            fontSize: '48px', color: '#ffffff', backgroundColor: '#0000ff', padding: { x: 15, y: 10 }
        }).setOrigin(1, 0.5).setInteractive();

        hintButton.on('pointerdown', () => {
            this.showHintPreview(true);
        });

        hintButton.on('pointerup', () => {
            this.showHintPreview(false);
        });

        hintButton.on('pointerout', () => {
            this.showHintPreview(false);
        });
    }

    private showHintPreview(visible: boolean): void {
        this.hintPreviewGraphics.clear();
        if (!visible) return;

        const mainGridMatrix = this.game.registry.get('mainGridMatrix');
        if (!mainGridMatrix) return;

        const PREVIEW_CELL_SIZE = 20;
        const PREVIEW_GRID_WIDTH = 11;
        const PREVIEW_GRID_HEIGHT = 11;
        const previewX = this.cameras.main.width - (PREVIEW_GRID_WIDTH * PREVIEW_CELL_SIZE) - 20;
        const previewY = 120;

        // Draw the preview grid background
        this.hintPreviewGraphics.fillStyle(0x000000, 0.7);
        this.hintPreviewGraphics.fillRect(previewX - 10, previewY - 10, (PREVIEW_GRID_WIDTH * PREVIEW_CELL_SIZE) + 20, (PREVIEW_GRID_HEIGHT * PREVIEW_CELL_SIZE) + 20);

        // Draw the grid cells
        for (let r = 0; r < PREVIEW_GRID_HEIGHT; r++) {
            for (let c = 0; c < PREVIEW_GRID_WIDTH; c++) {
                const color = mainGridMatrix[r][c] === 1 ? 0xffffff : 0x555555;
                this.hintPreviewGraphics.fillStyle(color, 0.9);
                this.hintPreviewGraphics.fillRect(previewX + c * PREVIEW_CELL_SIZE, previewY + r * PREVIEW_CELL_SIZE, PREVIEW_CELL_SIZE - 1, PREVIEW_CELL_SIZE - 1);
            }
        }
    }
}