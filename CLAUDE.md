# CLAUDE.md - Ralph Loop Edition

## What is This?

You are Claude Code running in a **Ralph Loop**. This means:

1. You will be executed multiple times (iterations)
2. Each time you run, you have **fresh context** 
3. Your progress persists in **git commits** and **progress.txt**
4. You read `prd.json` to know what to work on
5. You work on **ONE user story at a time**
6. When ALL stories are complete, you output `<promise>COMPLETE</promise>`

---

## Your Mission (Read This Every Iteration)

Build **Lyric Vault** - a local-first CLI tool for musicians to capture and intelligently retrieve lyrical ideas using Ollama.

**Tech Stack:**
- TypeScript + Node.js
- SQLite (better-sqlite3)
- Ollama (local AI)
- Commander.js (CLI)
- Chalk (terminal colors)

---

## How Ralph Loop Works

### Each Iteration You Must:

1. **Read `prd.json`** - This contains all user stories
2. **Read `progress.txt`** - This shows what's been done (if it exists)
3. **Check git history** - See what was implemented in previous iterations
4. **Pick the next story** - Find first story with `"status": "todo"` and no blocking dependencies
5. **Implement it completely** - Write code, test it works
6. **Update files:**
   - Mark story as `"status": "done"` and `"passes": true` in `prd.json`
   - Append to `progress.txt` with what you did
   - Commit with message: `feat: [US-XXX] Story title`
7. **Check if done** - If all stories have `"passes": true`, output `<promise>COMPLETE</promise>`

### Rules for Success:

- ✅ **One story per iteration** - Don't try to do multiple stories in one go
- ✅ **Test before marking done** - Run the code to verify it works
- ✅ **Always commit** - Even if there are minor issues, commit progress
- ✅ **Read dependencies** - Check `depends_on` field, don't work on stories with incomplete dependencies
- ✅ **Update both prd.json AND progress.txt** - Ralph uses both to track state
- ❌ **Don't skip stories** - Work in order unless dependencies block you
- ❌ **Don't hallucinate completion** - Only mark `passes: true` if you actually tested it

---

## File Structure You'll Build

```
lyric-vault/
├── prd.json              # ← User stories (YOU UPDATE THIS)
├── progress.txt          # ← Iteration log (YOU UPDATE THIS)
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # CLI entry point
│   ├── commands/
│   │   ├── setup.ts
│   │   ├── add.ts
│   │   ├── suggest.ts
│   │   ├── list.ts
│   │   ├── search.ts
│   │   ├── show.ts
│   │   └── delete.ts
│   ├── db/
│   │   ├── schema.sql
│   │   └── database.ts
│   ├── ai/
│   │   ├── ollama.ts
│   │   └── prompts.ts
│   ├── utils/
│   │   ├── rhyme.ts
│   │   ├── formatting.ts
│   │   └── config.ts
│   └── types/
│       └── index.ts
└── dist/                 # Compiled output
```

---

## TypeScript Interfaces (Reference)

```typescript
// src/types/index.ts - Create this in US-001!

export interface Lyric {
  id: number;
  lyric_text: string;
  created_at: string;
  themes: string[];
  rhyme_patterns: string[];
  mood: string;
  imagery_tags: string[];
  raw_analysis: string;
}

export interface LyricAnalysis {
  themes: string[];
  rhyme_patterns: string[];
  mood: string;
  imagery_tags: string[];
}

export interface LyricSuggestion {
  lyric: Lyric;
  match_score: number;
  match_reasons: string[];
  suggested_adaptation?: string;
}

export interface SearchQuery {
  theme?: string;
  rhyme?: string;
  mood?: string;
}

export interface Config {
  ollama_model: string;
  ollama_url: string;
  database_path: string;
}
```

---

## Database Schema (Reference)

```sql
-- src/db/schema.sql

CREATE TABLE IF NOT EXISTS lyrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lyric_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  themes TEXT,
  rhyme_patterns TEXT,
  mood TEXT,
  imagery_tags TEXT,
  raw_analysis TEXT
);

CREATE INDEX IF NOT EXISTS idx_created_at ON lyrics(created_at);
```

**Important:** Store arrays as JSON strings. Parse on read, stringify on write.

---

## Critical Implementation Patterns

### Ollama Integration

**Default model:** `llama3.2`  
**Default URL:** `http://localhost:11434`

**Analysis Prompt Pattern:**
```typescript
export const ANALYSIS_PROMPT = (lyricText: string) => `
You are analyzing a lyric fragment. Return ONLY valid JSON (no markdown, no explanation):
{
  "themes": ["theme1", "theme2", "theme3", "theme4"],
  "rhyme_patterns": ["ending1", "ending2"],
  "mood": "brief mood description",
  "imagery_tags": ["tag1", "tag2", "tag3"]
}

Lyric: "${lyricText}"

Guidelines:
- Themes: Core concepts/emotions (max 4). Examples: love, loss, freedom, nostalgia
- Rhyme patterns: Last 3-4 characters of words that could rhyme
- Mood: 2-3 word emotional tone. Examples: "melancholic, reflective"
- Imagery tags: Sensory elements. Examples: visual, auditory, nature

Return ONLY the JSON.
`;
```

**Parsing Ollama response:**
```typescript
const response = await axios.post(`${baseUrl}/api/generate`, {
  model: this.model,
  prompt: prompt,
  stream: false,
  options: { temperature: 0.3 }
});

let jsonStr = response.data.response.trim();
// Handle potential markdown code blocks
if (jsonStr.startsWith('```')) {
  jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}
const analysis = JSON.parse(jsonStr);
```

### Database Patterns

**Inserting with JSON:**
```typescript
stmt.run(
  lyricText,
  JSON.stringify(analysis.themes),
  JSON.stringify(analysis.rhyme_patterns),
  analysis.mood,
  JSON.stringify(analysis.imagery_tags),
  rawAnalysis
);
```

**Reading with JSON:**
```typescript
private rowToLyric(row: any): Lyric {
  return {
    id: row.id,
    lyric_text: row.lyric_text,
    created_at: row.created_at,
    themes: JSON.parse(row.themes || '[]'),
    rhyme_patterns: JSON.parse(row.rhyme_patterns || '[]'),
    mood: row.mood,
    imagery_tags: JSON.parse(row.imagery_tags || '[]'),
    raw_analysis: row.raw_analysis
  };
}
```

### CLI Entry Point Pattern

```typescript
#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('lyric')
  .description('Local-first CLI for capturing and finding lyrical ideas')
  .version('1.0.0');

program
  .command('add <text>')
  .description('Add a new lyric idea')
  .action(addCommand);

program.parse();
```

### Always Close Database

```typescript
export function listCommand(options: { recent?: number }) {
  const db = new LyricDatabase();
  try {
    // ... do work
  } finally {
    db.close();  // CRITICAL - prevents locks
  }
}
```

---

## Testing Your Work

After implementing a story, you MUST test it:

### Build test:
```bash
npm run build
# Should produce dist/ with no TypeScript errors
```

### Command tests:
```bash
# Setup
npm run dev setup

# Add lyrics
npm run dev add "coffee stains on your old sweater"
npm run dev add "we were young and reckless, burning bright"

# List
npm run dev list
npm run dev list --recent 2

# Search
npm run dev search "theme:nostalgia"

# Show
npm run dev show 1

# Suggest
npm run dev suggest "I still remember mornings when the world felt light"

# Delete
npm run dev delete 1
```

### Database check:
```bash
sqlite3 ~/.lyric-vault/lyrics.db "SELECT * FROM lyrics;"
```

**If tests fail:** Fix the code, test again, THEN commit and mark as done.

---

## Iteration Workflow Example

### Iteration 1: Fresh Start

1. Read `prd.json` → See 20 stories, all `"status": "todo"`
2. `progress.txt` doesn't exist yet (first run)
3. Find first story: `US-001` (no dependencies)
4. Implement:
   - Run `npm init -y`
   - Install dependencies
   - Create `tsconfig.json`
   - Create directory structure
   - Create `src/types/index.ts` with all interfaces
5. Test: `npm run build` succeeds
6. Update `prd.json` (edit the JSON file):
   ```json
   {
     "id": "US-001",
     "status": "done",
     "passes": true
   }
   ```
7. Create `progress.txt`:
   ```
   Iteration 1 - US-001: Project Setup and TypeScript Configuration
   - Created package.json with dependencies: typescript, commander, chalk, better-sqlite3, axios
   - Configured tsconfig.json with strict mode, ES2022 target
   - Created src/ directory structure (commands/, db/, ai/, utils/, types/)
   - Created TypeScript interfaces in src/types/index.ts
   - Build succeeds with no errors
   
   Status: 1/20 stories complete
   Next: US-002, US-003 (no blockers)
   
   ---
   ```
8. Git commit:
   ```bash
   git add .
   git commit -m "feat: [US-001] Project Setup and TypeScript Configuration"
   ```
9. Check if all done: No (19 remaining) → Exit

### Iteration 2: Back Again

1. Read `prd.json` → See `US-001` is `"done"`, 19 remaining
2. Read `progress.txt` → See what was accomplished
3. Check git: `git log --oneline` shows the commit
4. Find next story: `US-002` (depends on US-001 ✓, so can proceed)
5. Implement database schema...
6. Test, update files, commit
7. Exit

...continues until all 20 stories complete.

### Final Iteration: Victory!

1. Read `prd.json` → All stories have `"passes": true`
2. Output:
   ```
   🎉 Lyric Vault Complete!
   
   All 20 user stories implemented and tested.
   
   Summary:
   - ✓ Project setup and configuration
   - ✓ Database layer with SQLite
   - ✓ Ollama AI integration
   - ✓ All CLI commands functional
   - ✓ End-to-end testing complete
   - ✓ Documentation ready
   
   <promise>COMPLETE</promise>
   ```

---

## Dependency Resolution

Stories have `depends_on` fields. **You CANNOT work on a story until ALL its dependencies are done.**

**Example:**
```json
{
  "id": "US-008",
  "title": "Setup Command Implementation",
  "depends_on": ["US-002", "US-003", "US-004"],
  "status": "todo"
}
```

**Before working on US-008, check:**
1. Is `US-002` marked `"passes": true`? ✓
2. Is `US-003` marked `"passes": true`? ✓
3. Is `US-004` marked `"passes": true`? ✓

If **all** are true → You can work on US-008  
If **any** are false → Pick a different story

---

## Progress Tracking Format

Always append to `progress.txt`:

```
Iteration [N] - [US-XXX]: [Story Title]
- [What you implemented]
- [Files you created/modified]
- [Test results]
- [Any issues encountered]

Status: X/20 stories complete
Next: US-YYY (note any blockers)

---
```

**Example:**
```
Iteration 3 - US-003: Configuration Management
- Created src/utils/config.ts with loadConfig() and saveConfig()
- Default config: ollama_model=llama3.2, ollama_url=http://localhost:11434
- Config saved to ~/.lyric-vault/config.json
- Tested: loadConfig() returns defaults when file missing
- Tested: saveConfig() creates valid JSON file

Status: 3/20 complete
Next: US-004 (Ollama client), US-006 (formatting utils)

---
```

---

## When to Output COMPLETE

**Only when ALL stories in prd.json have `"passes": true`**

Check with:
```bash
cat prd.json | jq '.userStories[] | select(.passes == false)'
# If this returns nothing (empty) → All done!
```

**Then output:**
```
🎉 Lyric Vault is Complete!

All 20 user stories implemented and verified:
[List key accomplishments]

<promise>COMPLETE</promise>
```

---

## Common Pitfalls to Avoid

### ❌ Don't mark multiple stories done in one iteration
```json
// BAD - trying to do too much
{"id": "US-001", "status": "done", "passes": true},
{"id": "US-002", "status": "done", "passes": true}
```

### ✅ One story per iteration
```json
// GOOD - focused work
{"id": "US-001", "status": "done", "passes": true},
{"id": "US-002", "status": "todo", "passes": false}  // Next time
```

### ❌ Don't claim success without testing
```typescript
// Didn't actually run the code
console.log("✓ Works perfectly!");
```

### ✅ Actually test your implementation
```bash
npm run dev add "test lyric"
# Verify output looks correct
# Check database: sqlite3 ~/.lyric-vault/lyrics.db "SELECT * FROM lyrics;"
# THEN mark as done
```

### ❌ Don't forget progress.txt
- Ralph needs this to understand what happened
- Future iterations need context

### ✅ Always update progress.txt
- Document what you did
- Note test results
- Mention next steps

---

## Special Notes for This Project

### Ollama Requirement
- Tests for US-004, US-009, US-014, US-015 require Ollama running
- If Ollama not available, implement graceful error handling
- Setup command should test connection and provide guidance

### File Locations
- Database: `~/.lyric-vault/lyrics.db`
- Config: `~/.lyric-vault/config.json`
- Always check directory exists before writing

### Package.json Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js"
  },
  "bin": {
    "lyric": "./dist/index.js"
  }
}
```

### Terminal Output Style
Use chalk for colored output:
- `chalk.green()` - Success messages
- `chalk.red()` - Errors
- `chalk.yellow()` - Warnings
- `chalk.cyan()` - Labels/headings
- `chalk.gray()` - Secondary info
- `chalk.bold()` - Emphasis

**Example:**
```typescript
console.log(chalk.green('✓') + ' Lyric captured (#' + id + ')');
console.log(chalk.cyan('Themes: ') + themes.join(', '));
```

---

## Quick Reference Commands

```bash
# Check current state
cat prd.json | jq '.userStories[] | {id, title, status, passes}'
cat progress.txt
git log --oneline -5

# Find next available story
cat prd.json | jq '.userStories[] | select(.status == "todo" and (.depends_on == null or .depends_on == [])) | {id, title}'

# Check specific story dependencies
cat prd.json | jq '.userStories[] | select(.id == "US-008") | .depends_on'

# Verify all dependencies met
cat prd.json | jq '.userStories[] | select(.id == "US-002" or .id == "US-003") | {id, passes}'

# Test if project complete
cat prd.json | jq '[.userStories[] | .passes] | all'
# If true → output <promise>COMPLETE</promise>
```

---

## Your Checklist Before Marking Story Done

- [ ] Code written and files created
- [ ] TypeScript compiles (`npm run build` succeeds)
- [ ] Command tested manually (`npm run dev <command>`)
- [ ] Database verified (if applicable)
- [ ] Error handling implemented
- [ ] Terminal output formatted with chalk
- [ ] Updated `prd.json`: set `"status": "done"` and `"passes": true`
- [ ] Updated `progress.txt` with iteration summary
- [ ] Git commit: `git commit -m "feat: [US-XXX] Story title"`

---

## Final Instructions

**Each iteration:**

1. 📖 **Read** prd.json and progress.txt
2. 🔍 **Find** next story (check dependencies!)
3. 💻 **Code** the implementation
4. ✅ **Test** it actually works
5. 📝 **Update** prd.json (mark done) and progress.txt (log progress)
6. 💾 **Commit** to git
7. 🎯 **Check** if all done → output `<promise>COMPLETE</promise>` if yes

**Remember:** Each iteration you wake up with fresh context. The ONLY things that persist are:
- Git history
- Files on disk
- `prd.json` status
- `progress.txt` log

Work deliberately. Test thoroughly. Commit frequently. 

Let's build Lyric Vault! 🎵
