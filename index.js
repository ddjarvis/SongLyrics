#!/usr/bin/env node
import fs from 'node:fs/promises';


import nodeid3lib from 'node-id3';
const NodeID3 = nodeid3lib.Promise;

import {options, directories} from './components/globals.js';
import { getInput, parseInput } from './components/getInput.js';
import getDirectories from './components/getDirectories.js';
import getMp3List from './components/getMp3s.js';
import showHelp from './components/showHelp.js';
import processMp3s from './components/processMp3s.js';

const config = {};

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

console.log(options);
console.log(directories);

// console.log(inputs);
// console.log(dirs);
// console.log(mp3list.map((mp3,idx) => `${('0'.repeat(4)+idx).substr(-4)} ${mp3}`));




processMp3s(mp3list);

// time for i in {1..9}; do printf "[%d/9] %s" "${i}" "Loading..."; printf "\r\e[0J[%d/9] %s\n" "${i}" "$(g -r -e "*/.stversions/*" "#{SL2}")"; done