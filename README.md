# Lyric Vault

A local-first tool for musicians to capture and intelligently retrieve lyrical ideas using AI.

**Now with a desktop GUI!**

## Download

### macOS (Apple Silicon)
1. Download the latest `.dmg` from [Releases](../../releases/latest)
2. Open the DMG and drag **Lyric Vault** to Applications
3. Right-click the app → **Open** (required first time, since the app isn't code-signed)
4. Make sure [Ollama](https://ollama.ai) is running with `ollama serve`

> **Note**: Intel Mac and Windows/Linux builds coming soon. For now, build from source (see below).

## Overview

Lyric Vault helps songwriters and lyricists:
- **Capture** lyrical fragments with automatic AI analysis
- **Search** your vault by theme, mood, or rhyme pattern
- **Discover** relevant lyrics from your collection when working on new songs
- **Get AI-powered suggestions** for adapting stored lyrics to new contexts

All data stays on your machine. No cloud services, no subscriptions - just your lyrics and a local AI.

## Tech Stack

- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment
- **SQLite** (better-sqlite3) - Local database storage
- **Ollama** - Local AI for lyric analysis and suggestions
- **Electron** - Desktop application framework
- **React** - GUI framework
- **Commander.js** - CLI framework
- **Chalk** - Terminal styling

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.ai) installed and running locally

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vj6twm9v5h-del/lyric-vault.git
   cd lyric-vault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Ollama** (if not already installed):
   ```bash
   # macOS
   brew install ollama

   # Or download from https://ollama.ai

   # Start Ollama
   ollama serve

   # Pull the default model
   ollama pull llama3.2
   ```

## Desktop App (GUI)

### Running the GUI

```bash
npm run electron:dev
```

This launches the Lyric Vault desktop app with a clean, modern interface.

### GUI Features

| Page | Description |
|------|-------------|
| **Dashboard** | Overview of your vault with stats and recent lyrics |
| **Add Lyric** | Input lyrics with real-time AI analysis preview |
| **Browse** | Grid view of all lyrics with filtering and search |
| **Search** | Search by theme, mood, or rhyme pattern |
| **Suggest** | Get AI-powered suggestions for your current lyric |
| **Settings** | Configure Ollama, toggle dark mode, view stats |

### Building for Production

```bash
npm run electron:build
```

This creates distributable installers in the `release/` directory.

---

## Command Line Interface (CLI)

The CLI is still fully functional for terminal-based workflows.

### Quick Start

**Initialize Lyric Vault:**
```bash
npm run build
npm start setup
```

**Add your first lyric:**
```bash
npm start add "coffee stains on your old sweater, memories we can't forget"
```

**Example output:**
```
Analyzing lyric with Ollama...

✓ Lyric captured (#1)

Lyric #1
Added: 1/28/2026, 10:30:45 PM

"coffee stains on your old sweater, memories we can't forget"

Themes: nostalgia, memory, love, loss
Mood: melancholic, reflective
Rhymes: etter, orget
Imagery: visual, tactile
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `npm start setup` | Initialize database, test Ollama connection |
| `npm start add <text>` | Add a new lyric with AI analysis |
| `npm start list [--recent N]` | List recent lyrics (default: 10) |
| `npm start search <query>` | Search by `theme:X`, `rhyme:Y`, or `mood:Z` |
| `npm start show <id>` | Display full details of a lyric |
| `npm start delete <id>` | Remove a lyric from your vault |
| `npm start suggest <text>` | Find matching lyrics with AI adaptations |

### CLI Examples

```bash
# List your lyrics
npm start list
npm start list --recent 5

# Search by theme, mood, or rhyme
npm start search "theme:love"
npm start search "mood:melancholic"
npm start search "rhyme:ight"
npm start search "theme:nostalgia mood:reflective"

# Get AI suggestions
npm start suggest "I still remember mornings when the world felt light"

# View or delete a specific lyric
npm start show 1
npm start delete 3
```

---

## Development

```bash
# GUI development (hot reload)
npm run electron:dev

# CLI development (no build needed)
npm run dev add "your lyric here"

# Build CLI only
npm run build

# Build GUI only
npm run gui:build

# Build everything for distribution
npm run electron:build
```

## All npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run CLI in development mode |
| `npm run build` | Build CLI to `dist/` |
| `npm start` | Run built CLI |
| `npm run gui:dev` | Start GUI dev server only |
| `npm run gui:build` | Build GUI to `dist-gui/` |
| `npm run electron:dev` | Run full Electron app in dev mode |
| `npm run electron:run` | Run production Electron app (builds GUI first) |
| `npm run electron:build` | Build distributable Electron app |

## Data Storage

All data is stored locally in `~/.lyric-vault/`:
- `lyrics.db` - SQLite database with your lyrics
- `config.json` - Configuration (Ollama URL, model, etc.)

Both the GUI and CLI share the same database, so you can use whichever interface you prefer.

## Configuration

Default configuration:
```json
{
  "ollama_model": "llama3.2",
  "ollama_url": "http://localhost:11434",
  "database_path": "~/.lyric-vault/lyrics.db"
}
```

You can edit settings via:
- **GUI**: Settings page
- **CLI**: Edit `~/.lyric-vault/config.json` directly

## How It Works

1. **Capture**: When you add a lyric, Ollama analyzes it to extract:
   - Themes (love, loss, freedom, etc.)
   - Rhyme patterns (ending sounds)
   - Mood (emotional tone)
   - Imagery tags (sensory elements)

2. **Search**: Query your vault using natural filters that match against the AI-extracted metadata.

3. **Suggest**: When writing new lyrics, get matched suggestions from your vault based on:
   - Shared themes (35% weight)
   - Rhyme compatibility (30% weight)
   - Mood similarity (25% weight)
   - Imagery overlap (10% weight)

   Plus AI-generated adaptations that blend your stored lyrics with your current context.

## License

MIT
