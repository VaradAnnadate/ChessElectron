# ♞ Chess Desktop

A modern, responsive desktop chess application built with **React**, **Vite**, and **Electron**, powered by `chess.js` and a built-in WebSocket chess server.

---

## 🌟 Key Features

### 🎮 Game Modes & Engine
- **Local Two-Player**: Play chess locally with a friend on the same computer.
- **Play vs Computer**: Challenge the built-in chess engine with multiple difficulty levels (Easy, Medium, and Hard) powered by minimax with alpha-beta pruning and piece-square tables running in a dedicated web worker.
- **Chess Clocks & Time Controls**: Full clock support for Bullet (1 min), Blitz (3+2, 5 min), Rapid (10 min), or untimed casual play.
- **Multiplayer Server**: Dedicated WebSocket server (`server/index.js`) with room codes, quick matchmaking, time control synchronization, draw offers, resignation, and chat.

### 🔊 Procedural Web Audio Sound Effects
- Pure Web Audio API sound synthesizer with zero external audio assets or dependencies.
- Distinct audio feedback for piece drops, captures, checks, pawn promotions, and game-over outcomes.
- Audio mute toggle in the side panel header and via keyboard shortcut (`M`).

### ⏪ Interactive Move Replay & Navigation
- Click any move in the move list to step back in time and inspect previous board positions.
- Step navigation toolbar (`⏮`, `◀`, `▶`, `⏭`) with live position indicator.
- Keyboard navigation: use `ArrowLeft` and `ArrowRight` to step through moves and `Escape` to return to the live position.

### 🎨 Customizable Board Themes
- Choose between multiple curated board color palettes:
  - **Emerald** (Classic tournament green & buff)
  - **Wood** (Warm wooden walnut & parchment)
  - **Ocean** (Cool navy & slate)
  - **Midnight** (Sleek dark mode)
- Select themes on the Home screen or cycle them instantly mid-game using the `🎨` button.

### 🏆 Game Over Summary & Match Stats
- Post-game outcome modal with win/loss/draw banners, match result badge (`1-0`, `0-1`, `½-½`), and move statistics.
- Actions for instant rematch, board review, PGN copying, and menu navigation.
- Subtle check pulse animation on the King and target capture indicators.

### 📋 Sharing & Analysis Export
- **Copy FEN**: Copy the current board position notation to clipboard with one click.
- **Copy PGN**: Copy full game notation for easy review and analysis in external tools like Lichess or Chess.com.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `N` | Start a new game |
| `F` | Flip board orientation |
| `Ctrl+Z` / `Cmd+Z` | Undo move |
| `M` | Toggle sound effects on/off |
| `←` (Left Arrow) | Step back to previous move |
| `→` (Right Arrow) | Step forward to next move |
| `Escape` | Return to live board |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite
- **Desktop Runtime**: Electron 38
- **Chess Rules Engine**: `chess.js`
- **Audio Engine**: Web Audio API
- **Styling**: Vanilla CSS (CSS variables, responsive layouts, micro-animations)
- **Backend / Networking**: Node.js, `ws` (WebSocket)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/VaradAnnadate/ChessElectron.git
cd ChessElectron

# Install dependencies
npm install
```

### Running Locally

```bash
# Start the Electron desktop app in development mode
npm run dev

# Start the standalone chess WebSocket server (optional, for online multiplayer)
npm run server
```

### Production Build

```bash
# Build Vite production assets
npm run build

# Launch the built Electron application
npm start
```

---

## 📄 License

MIT
## Development

Run `npm run dev` to start Vite + Electron.

Built with React, Vite, Electron, and Node.js.
