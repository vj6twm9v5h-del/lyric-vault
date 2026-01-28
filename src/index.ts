#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('lyric')
  .description('Local-first CLI for capturing and finding lyrical ideas')
  .version('1.0.0');

// Commands will be registered here in future iterations

program.parse();
