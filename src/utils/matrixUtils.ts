/**
 * Rotates a 2D matrix 90 degrees clockwise.
 * @param matrix The matrix to rotate.
 * @returns A new matrix that has been rotated.
 */
export function rotateMatrixCW(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const newMatrix = Array.from({ length: cols }, () => Array(rows).fill(0));

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            newMatrix[col][rows - 1 - row] = matrix[row][col];
        }
    }
    return newMatrix;
}

/**
 * Rotates a 2D matrix 90 degrees counter-clockwise.
 * @param matrix The matrix to rotate.
 * @returns A new matrix that has been rotated.
 */
export function rotateMatrixCCW(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const newMatrix = Array.from({ length: cols }, () => Array(rows).fill(0));

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            newMatrix[cols - 1 - col][row] = matrix[row][col];
        }
    }
    return newMatrix;
}

/**
 * Flips a 2D matrix horizontally.
 * @param matrix The matrix to flip.
 * @returns A new matrix that has been flipped.
 */
export function flipMatrixHorizontal(matrix: number[][]): number[][] {
    return matrix.map(row => row.slice().reverse());
}

/**
 * Trims empty rows and columns from a matrix.
 * @param matrix The matrix to trim.
 * @returns A new, compact matrix, or a [[0]] matrix if empty.
 */
export function trimMatrix(matrix: number[][]): number[][] {
    if (!matrix || matrix.length === 0) return [[0]];
    
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

    // Handle case where matrix was empty or all zeros
    if (bottom === -1) return [[0]];

    const newMatrix: number[][] = [];
    for (let r = top; r <= bottom; r++) {
        newMatrix.push(matrix[r].slice(left, right + 1));
    }

    return newMatrix;
}