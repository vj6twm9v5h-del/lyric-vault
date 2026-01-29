#!/usr/bin/env node

import { Command } from 'commander';
import { setupCommand } from './commands/setup.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';

const program = new Command();

program
  .name('lyric')
  .description('Local-first CLI for capturing and finding lyrical ideas')
  .version('1.0.0');

// Setup command
program
  .command('setup')
  .description('Initialize Lyric Vault (test Ollama, create database, save config)')
  .action(async () => {
    await setupCommand();
  });

// Add command
program
  .command('add <text>')
  .description('Add a new lyric idea with AI analysis')
  .action(async (text: string) => {
    await addCommand(text);
  });

// List command
program
  .command('list')
  .description('List recent lyrics from your vault')
  .option('-r, --recent <number>', 'Number of recent lyrics to show', '10')
  .action((options) => {
    listCommand({ recent: parseInt(options.recent, 10) });
  });

program.parse();
