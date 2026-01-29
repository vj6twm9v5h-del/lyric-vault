# Lyric Vault

A local-first CLI tool for musicians to capture and intelligently retrieve lyrical ideas using AI.

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
- **Commander.js** - CLI framework
- **Chalk** - Terminal styling

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.ai) installed and running locally

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/lyric-vault.git
   cd lyric-vault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Set up Ollama** (if not already installed):
   ```bash
   # macOS
   brew install ollama

   # Or download from https://ollama.ai

   # Start Ollama
   ollama serve

   # Pull the default model
   ollama pull llama3.2
   ```

5. **Initialize Lyric Vault:**
   ```bash
   npm start setup
   ```

## Quick Start

### Add your first lyric
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

### List your lyrics
```bash
npm start list
npm start list --recent 5
```

### Search by theme, mood, or rhyme
```bash
npm start search "theme:love"
npm start search "mood:melancholic"
npm start search "rhyme:ight"
npm start search "theme:nostalgia mood:reflective"
```

### Get AI suggestions
```bash
npm start suggest "I still remember mornings when the world felt light"
```

**Example output:**
```
Analyzing your lyric...
Finding matches in your vault...
Generating AI adaptations...

Found 2 matches

#1 Match (40%)
"coffee stains on your old sweater, memories we can't forget"

Why it matches:
  • Shared themes: nostalgia, memory
  • Similar mood
  • Compatible rhyme patterns

Suggested adaptation:
  "I still remember coffee mornings, your sweater soft and light"

---

#2 Match (35%)
"we were young and reckless burning bright like summer stars"

Why it matches:
  • Shared themes: memory
  • Compatible rhyme patterns

Suggested adaptation:
  "We were young when mornings felt so light, burning bright"
```

### View a specific lyric
```bash
npm start show 1
```

### Delete a lyric
```bash
npm start delete 3
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `setup` | Initialize database, test Ollama connection, save config |
| `add <text>` | Add a new lyric with AI analysis |
| `list [--recent N]` | List recent lyrics (default: 10) |
| `search <query>` | Search by `theme:X`, `rhyme:Y`, or `mood:Z` |
| `show <id>` | Display full details of a lyric |
| `delete <id>` | Remove a lyric from your vault |
| `suggest <text>` | Find matching lyrics with AI adaptations |

## Development

```bash
# Run in development mode (no build needed)
npm run dev add "your lyric here"

# Build for production
npm run build

# Run production build
npm start add "your lyric here"
```

## Data Storage

All data is stored locally in `~/.lyric-vault/`:
- `lyrics.db` - SQLite database with your lyrics
- `config.json` - Configuration (Ollama URL, model, etc.)

## Configuration

Default configuration:
```json
{
  "ollama_model": "llama3.2",
  "ollama_url": "http://localhost:11434",
  "database_path": "~/.lyric-vault/lyrics.db"
}
```

Edit `~/.lyric-vault/config.json` to change settings.

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

## Portfolio Context

This project was built as a demonstration of:
- **AI-augmented CLI tools** - Practical integration of local LLMs
- **TypeScript best practices** - Strict typing, modular architecture
- **SQLite for local-first apps** - No cloud dependencies
- **Clean CLI design** - Intuitive commands with helpful output

Built with Claude Code in an iterative development process.

## License

MIT
