import Phaser from 'phaser';
import { rotateMatrixCW, rotateMatrixCCW, flipMatrixHorizontal } from '../utils/matrixUtils';


interface IShapeConfig {
    scene: Phaser.Scene;
    x: number;
    y: number;
    matrix: number[][];
    cellSize: number;
    color?: number;
}

export default class Shape extends Phaser.GameObjects.Container {
    public matrix: number[][];
    private cellSize: number;
    private blockColor: number;
    private debugGraphics: Phaser.GameObjects.Graphics;
    public isPlaced: boolean = false;
    public startX: number;
    public startY: number;

    constructor(config: IShapeConfig) {
        super(config.scene, config.x, config.y);
        this.matrix = config.matrix;
        this.cellSize = config.cellSize;
        this.startX = config.x;
        this.startY = config.y;
        this.blockColor = config.color || 0x00ff00;

        this.debugGraphics = this.scene.add.graphics();
        this.add(this.debugGraphics);
        this.scene.add.existing(this);

        this.drawShape();
        this.setInteractiveAndHitArea();
        this.updateSizeAndHitArea(); // Set initial size and hit area geometry
        //this.drawDebugHitArea();     // Draw the debug outline *after* setup
    }

    public get color(): number {
        return this.blockColor;
    }
    
    /** Recalculates container size and repositions the hitArea to match the current matrix. */
    private updateSizeAndHitArea(): void {
        if (!this.input) return; // Guard against running before interactive is set

        const shapeWidth = this.matrix[0].length * this.cellSize;
        const shapeHeight = this.matrix.length * this.cellSize;

        // 1. Update the container's own size.
        // setSize is correct for a Container as it updates .width and .height,
        // which are used by the hitAreaCallback for calculations.
        this.setSize(shapeWidth, shapeHeight);

        // 2. Update the Phaser-managed hit area rectangle
        const hitArea = this.input.hitArea as Phaser.Geom.Rectangle;

        // Position the hit area so its top-left is at the top-left of the drawn shape.
        // Since the shape is drawn centered on the container's origin, we offset by half.
        hitArea.setPosition(-shapeWidth / 2, -shapeHeight / 2);
        hitArea.setSize(shapeWidth, shapeHeight);
    }
    
    private drawShape(): void {
        const childrenToRemove = this.list.filter(child => child !== this.debugGraphics);
        childrenToRemove.forEach(child => child.destroy());

        const shapeWidth = this.matrix[0].length * this.cellSize;
        const shapeHeight = this.matrix.length * this.cellSize;
        const offsetX = shapeWidth / 2;
        const offsetY = shapeHeight / 2;
        
        for (let row = 0; row < this.matrix.length; row++) {
            for (let col = 0; col < this.matrix[0].length; col++) {
                if (this.matrix[row][col] === 1) {
                    const blockX = (col * this.cellSize) - offsetX + (this.cellSize / 2);
                    const blockY = (row * this.cellSize) - offsetY + (this.cellSize / 2);
                    
                    const block = this.scene.add.rectangle(blockX, blockY, this.cellSize, this.cellSize);
                    block.setOrigin(0.5, 0.5);
                    block.setStrokeStyle(1, 0x000000, 0.5);

                    const color = this.isPlaced 
                        ? Phaser.Display.Color.ValueToColor(this.blockColor).darken(30).color 
                        : this.blockColor;
                    block.setFillStyle(color);
                    
                    this.add(block);
                }
            }
        }
        this.bringToTop(this.debugGraphics);
    }
    
    private setInteractiveAndHitArea(): void {
        if (this.input) return;

        // Create a Rectangle for the hit area. Its size and position will be updated
        // dynamically in updateSizeAndHitArea to match the shape's current matrix.
        const hitArea = new Phaser.Geom.Rectangle(0, 0, 0, 0);
        this.setInteractive({
            hitArea: hitArea,
            hitAreaCallback: (hitArea: Phaser.Geom.Rectangle, x: number, y: number, gameObject: Phaser.GameObjects.GameObject): boolean => {
                const shape = gameObject as Shape;
                // When a `hitArea` rectangle is provided, the `x` and `y` coordinates passed to this
                // callback are relative to the top-left of that `hitArea` rectangle.
                // Our `updateSizeAndHitArea` method positions the hitArea's top-left to match the
                // visual top-left of the shape. Therefore, `x` and `y` are already the local
                // coordinates within the shape's bounding box.
                const col = Math.floor(x / shape.cellSize);
                const row = Math.floor(y / shape.cellSize);
                return !!(shape.matrix[row] && shape.matrix[row][col] === 1);
            },
            draggable: true,
            useHandCursor: true
        });

        // --- Drag Events ---
        this.on('dragstart', () => {
            this.scene.children.bringToTop(this);
            this.scene.tweens.add({ targets: this, scale: 1.1, ease: 'Power1', duration: 150 });
        });

        this.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            // For Containers, we must manually update the position during a drag.
            this.x = dragX;
            this.y = dragY;

            // Then, we emit our custom event so scenes can react to the new position.
            this.emit('dragging', this);
        });

        this.on('dragend', (pointer: Phaser.Input.Pointer) => {
            this.scene.tweens.add({
                targets: this, scale: 1.0, ease: 'Power1', duration: 150,
                // Emit 'dropped' with just the shape, as scenes expect.
                onComplete: () => this.emit('dropped', this)
            });
        });
    }

    private transform(transformation: (matrix: number[][]) => number[][]): void {
        if (this.isPlaced) return;

        this.matrix = transformation(this.matrix);
        this.drawShape();            // Redraw the visual blocks
        this.updateSizeAndHitArea(); // THEN, sync the container size and hit area
        this.emit('transformed', this); // Emit an event so scenes can react
        //this.drawDebugHitArea();     // Finally, update the debug visual
    }
    
    // --- Public API ---
    public place(): void {
        this.isPlaced = true;
        this.disableInteractive();
        this.drawShape();
    }

    public returnToStart(): void {
        this.scene.tweens.add({ targets: this, x: this.startX, y: this.startY, ease: 'Power1', duration: 200 });
    }

    public rotateCW(): void { this.transform(rotateMatrixCW); }
    public rotateCCW(): void { this.transform(rotateMatrixCCW); }
    public flip(): void { this.transform(flipMatrixHorizontal); }

    /**
     * Gets the grid coordinates that this shape would occupy if its top-left corner were at the given grid cell.
     * @param baseCol The column where the shape's top-left (0,0) is placed.
     * @param baseRow The row where the shape's top-left (0,0) is placed.
     * @returns An array of {x, y} coordinates for each block in the shape.
     */
    public getGridCells(baseCol: number, baseRow: number): { x: number, y: number }[] {
        const cells: { x: number, y: number }[] = [];
        for (let r = 0; r < this.matrix.length; r++) {
            for (let c = 0; c < this.matrix[0].length; c++) {
                if (this.matrix[r][c] === 1) {
                    cells.push({ x: baseCol + c, y: baseRow + r });
                }
            }
        }
        return cells;
    }

    /**
     * Calculates the projected grid column, row, and occupied cells based on the shape's current world position.
     * @param gridX The top-left X coordinate of the grid.
     * @param gridY The top-left Y coordinate of the grid.
     * @param gridCellSize The size of a single cell in the grid.
     * @returns An object containing the projected column, row, and an array of occupied cell coordinates.
     */
    public getProjectedGridInfo(gridX: number, gridY: number, gridCellSize: number): { col: number, row: number, cells: {x: number, y: number}[] } {
        const shapeTopLeftX = this.x - this.width / 2;
        const shapeTopLeftY = this.y - this.height / 2;

        const col = Math.round((shapeTopLeftX - gridX) / gridCellSize);
        const row = Math.round((shapeTopLeftY - gridY) / gridCellSize);

        const cells = this.getGridCells(col, row);

        return { col, row, cells };
    }

    /**
     * Snaps the shape's position to a specific cell on a grid.
     * @param gridX The top-left X coordinate of the grid.
     * @param gridY The top-left Y coordinate of the grid.
     * @param gridCellSize The size of a single cell in the grid.
     * @param col The target grid column.
     * @param row The target grid row.
     */
    public snapToGrid(gridX: number, gridY: number, gridCellSize: number, col: number, row: number): void {
        this.x = (gridX + col * gridCellSize) + this.width / 2;
        this.y = (gridY + row * gridCellSize) + this.height / 2;
    }
    
    // --- Debugging ---
    private drawDebugHitArea(): void {
        this.debugGraphics.clear();
        if (this.input && this.input.hitArea) {
            this.debugGraphics.lineStyle(4, 0xff00ff, 0.8);
            const hitArea = this.input.hitArea as Phaser.Geom.Rectangle;
            this.debugGraphics.strokeRect(hitArea.x, hitArea.y, hitArea.width, hitArea.height);
        }
    }
}