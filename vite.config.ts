import { defineConfig } from 'vite';

export default defineConfig({
    // IMPORTANT: Change this to your repository name
    base: '/BlockPuzzleComposerPhaser/', 
    
    // Set to false to prevent Vite from clearing the console.
    clearScreen: false,

    build: {
        // This is the directory where the build output will be placed.
        // Default is 'dist', which is fine.
        outDir: 'dist',
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    }
});