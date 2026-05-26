#!/usr/bin/env node

import 'dotenv/config'; 

import fs from 'node:fs/promises';

import chalk from 'chalk';

import {options, directories} from './components/globals.js';
import { getInput, parseInput } from './components/getInput.js';
import getDirectories from './components/getDirectories.js';
import getMp3List from './components/getMp3s.js';
import showHelp from './components/showHelp.js';
import processMp3s from './components/processMp3s.js';


const config = {};

// ==========================================
// GRACEFUL SHUTDOWN HANDLER
// ==========================================
function handleExit(signal) {
	// cleanupUI(); // Stop spinners, stop progress bars, show cursor
	console.log(chalk.yellow(`\n⚠️  Process interrupted by user (${signal}). Exiting...`));
	
	// 130 is the standard exit code for a process terminated by Ctrl+C (SIGINT)
	process.exit(130); 
}

process.on('SIGINT', () => handleExit('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => handleExit('SIGTERM')); // kill command / Task Manager


function displayHelp() {
	showHelp();
}

const inputs = parseInput();	// inputs.opts.recursive [bool], inputs.dirs [arr]
if(inputs.opts.help) {
	displayHelp();
	process.exit(0);
}
config.excludes = inputs.opts.exclude;
config.recursive = inputs.opts.recursive;

const dirs = getDirectories(inputs.dirs);
const mp3list = getMp3List(dirs, config);

if(options['debug']) {
	console.log(options);
	console.log(directories);
}

// console.log(inputs);
// console.log(dirs);
// console.log(mp3list.map((mp3,idx) => `${('0'.repeat(4)+idx).substr(-4)} ${mp3}`));

// time for i in {1..9}; do printf "[%d/9] %s" "${i}" "Loading..."; printf "\r\e[0J[%d/9] %s\n" "${i}" "$(g -r -e "*/.stversions/*" "#{SL2}")"; done

processMp3s(mp3list);

