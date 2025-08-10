// src/managers/ShapeFactory.ts

export default class ShapeFactory {
    /**
     * Generates a 2D matrix for a random, contiguous shape.
     * @param minCells The minimum number of cells in the shape.
     * @param maxCells The maximum number of cells in the shape.
     * @param gridSize The size of the generation grid (e.g., 3 for 3x3).
     * @returns A trimmed 2D number array representing the shape.
     */
    public generateShapeMatrix(minCells: number = 3, maxCells: number = 5, gridSize: number = 3): number[][] {
        const grid: number[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
        const numCells = Phaser.Math.Between(minCells, maxCells);
        let placedCells = 0;

        // Possible directions to grow (up, right, down, left)
        const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
        const activeCells: { r: number, c: number }[] = [];

        // Start with a random cell
        const startR = Phaser.Math.Between(0, gridSize - 1);
        const startC = Phaser.Math.Between(0, gridSize - 1);
        grid[startR][startC] = 1;
        activeCells.push({ r: startR, c: startC });
        placedCells++;

        while (placedCells < numCells && activeCells.length > 0) {
            // Pick a random active cell to grow from
            const currentCell = Phaser.Math.RND.pick(activeCells);

            // Find valid, unoccupied neighbors that only touch the shape at one edge
            const neighbors = directions
                .map(dir => ({ r: currentCell.r + dir[0], c: currentCell.c + dir[1] }))
                .filter(n => {
                    // Basic bounds and occupation check
                    if (n.r < 0 || n.r >= gridSize || n.c < 0 || n.c >= gridSize || grid[n.r][n.c] !== 0) {
                        return false;
                    }

                    // Check for contiguity rule (must touch exactly one existing cell)
                    let occupiedNeighbors = 0;
                    for (const dir of directions) {
                        const checkR = n.r + dir[0];
                        const checkC = n.c + dir[1];
                        if (checkR >= 0 && checkR < gridSize && checkC >= 0 && checkC < gridSize && grid[checkR][checkC] === 1) {
                            occupiedNeighbors++;
                        }
                    }
                    return occupiedNeighbors === 1;
                });

            if (neighbors.length > 0) {
                const nextCell = Phaser.Math.RND.pick(neighbors);
                grid[nextCell.r][nextCell.c] = 1;
                activeCells.push(nextCell);
                placedCells++;
            } else {
                // No more valid neighbors from this cell, remove it from active consideration
                activeCells.splice(activeCells.indexOf(currentCell), 1);
            }
        }

        return this.trimMatrix(grid);
    }

    /**
     * Trims empty rows and columns from a matrix.
     */
    private trimMatrix(matrix: number[][]): number[][] {
        let top = matrix.length, bottom = -1, left = matrix[0].length, right = -1;

        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
                if (matrix[r][c] === 1) {
                    top = Math.min(top, r);
                    bottom = Math.max(bottom, r);
                    left = Math.min(left, c);
                    right = Math.max(right, c);
                }
            }
        }

        if (bottom === -1) return [[1]]; // Handle case of single block or error

        const newMatrix: number[][] = [];
        for (let r = top; r <= bottom; r++) {
            newMatrix.push(matrix[r].slice(left, right + 1));
        }

        return newMatrix;
    }
}