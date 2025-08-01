# Block Puzzle Composer

A creative block puzzle game where you design the pieces you play. Built with Phaser 3 and TypeScript.

![Gameplay GIF](https-placeholder-for-your-gameplay.gif)
*(Suggestion: Replace the line above with a real GIF of your game in action!)*

---

## 🎮 Gameplay

Block Puzzle Composer flips the script on traditional block puzzle games. Instead of being given random pieces, you are the architect! The game is played in two distinct phases:

1.  **Build Phase:** You are presented with a blank canvas. Click on cells to design your own unique "super shape."
2.  **Place Phase:** Take the shape you just created and place it onto the main game grid. Strategically position your piece to clear lines and columns.

After placing your piece, the game loops back to the Build Phase, where you'll create the next piece to continue the challenge.

### ✨ Features

- **Two-Phase Gameplay:** A unique loop of creating and then placing your own puzzle pieces.
- **Dynamic Shape Transformations:** Rotate and flip your custom shapes to find the perfect fit.
- **Line & Column Clearing:** Clear completed rows and columns from the grid to score points.
- **Interactive UI:** Clean buttons and intuitive drag-and-drop controls.
- **Drop Preview:** A "ghost" shape shows exactly where your piece will land on the grid.
- **Pixel-Perfect Hit Detection:** Drag shapes by clicking on any of their component blocks, not just the empty space around them.

---

## 🛠️ Technical Details

This project is built with modern web technologies and serves as a great example of a well-structured Phaser 3 game.

- **Engine:** [Phaser 3](https://phaser.io/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Key Phaser Concepts Used:**
    - Scene Management (`BuildScene`, `MainScene`)
    - Custom GameObjects (`Shape`, `Grid`)
    - Advanced Input Handling (Draggable Containers, Custom Hit Areas)
    - Global Event Bus for decoupled communication
    - Graphics API for rendering previews and debug shapes
    - Tweens for smooth animations

---

## 🚀 Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/BlockPuzzleComposerPhaser.git
    cd BlockPuzzleComposerPhaser
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

Now, open your web browser and navigate to the local server address provided (usually `http://localhost:8080` or similar).

---

## 📦 Building and Previewing

To create a production-ready build of the game in the `dist` folder:

```bash
npm run build
```

To test the production build locally, you can run a preview server:

```bash
npm run preview
```
This will serve the `dist` folder on a local web server, allowing you to test the game exactly as it would behave when deployed.
---

## 🌐 Deployment

This project is configured for easy deployment to GitHub Pages.

1.  **Configure `vite.config.ts`:** Open `vite.config.ts` and ensure the `base` property matches your GitHub repository name (e.g., `/your-repo-name/`).

2.  **Run the deploy script:**
    ```bash
    npm run deploy
    ```
    This command builds the project and uses the `gh-pages` package to automatically create (or update) a `gh-pages` branch in your repository with the contents of the `dist` folder.

3.  **Enable GitHub Pages:** In your GitHub repository settings, navigate to the "Pages" section. Set the source to "Deploy from a branch" and select the `gh-pages` branch with the `/ (root)` folder.

After a minute or two, your game will be live at the URL provided by GitHub Pages!
