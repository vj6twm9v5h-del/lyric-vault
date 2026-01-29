#!/usr/bin/env node

import { Command } from 'commander';
import { setupCommand } from './commands/setup.js';

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

program.parse();
