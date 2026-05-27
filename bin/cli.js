#!/usr/bin/env node

import 'dotenv'; // Load .env only when run as a CLI

import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// 1. Define potential .env paths in order of priority
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATHS = [
	path.join(os.homedir(), '.config', 'songlyrics', '.env'), // 1. Global config (Recommended)
	path.join(process.cwd(), '.env'),                         // 2. Current Working Directory
	path.join(__dirname, '.env')                              // 3. Project root (Fallback)
];

// 2. Load the first .env file found
for (const envPath of ENV_PATHS) {
	if (fs.existsSync(envPath)) {
		dotenv.config({ path: envPath });
		// Optional: console.log(`Loaded env from: ${envPath}`);
		break; 
	}
}

import chalk from 'chalk';

import { parseInput } from '../components/getInput.js';
import showHelp from '../components/showHelp.js';
import run from '../index.js'; // Import the core logic
import { state } from '../components/globals.js';
import { setExecutionMode } from '../components/executionMode.js';

if(!state.executionMode) {
	setExecutionMode(import.meta);
	// console.log(state.executionMode); 
}

function handleExit(signal) {
	console.log(chalk.redBright(`\n⚠️  Process interrupted by user (${signal}). Exiting...`));
	process.exit(1); 
}

process.on('SIGINT', () => handleExit('SIGINT'));
process.on('SIGTERM', () => handleExit('SIGTERM'));

async function main() {
	const inputs = parseInput();
	if (inputs.opts.debug) {
		console.log(inputs.opts);
		console.log(inputs);
	}
	if (inputs.opts.help) {
		showHelp();
		process.exit(0);
	}

	try {
		// Pass the parsed CLI args to the core library function
		// console.log(`Mistral Key: ${process.env["MISTRAL_API_KEY"]}`);
		await run();
	} catch (error) {
		console.error(chalk.red(`\n❌ Fatal Error: ${error.message}`));
		if (inputs.opts.debug) console.error(error);
		process.exit(1);
	}
}

main();