#!/usr/bin/env node

import 'dotenv/config'; // Load .env only when run as a CLI
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
	console.log(chalk.yellow(`\n⚠️  Process interrupted by user (${signal}). Exiting...`));
	process.exit(1); 
}

process.on('SIGINT', () => handleExit('SIGINT'));
process.on('SIGTERM', () => handleExit('SIGTERM'));

async function main() {
	const inputs = parseInput();

	if (inputs.opts.help) {
		showHelp();
		process.exit(0);
	}

	try {
		// Pass the parsed CLI args to the core library function
		await run();
	} catch (error) {
		console.error(chalk.red(`\n❌ Fatal Error: ${error.message}`));
		if (inputs.opts.debug) console.error(error);
		process.exit(1);
	}
}

main();