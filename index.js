#!/usr/bin/env node
import fs from 'node:fs/promises';

import nodeid3lib from 'node-id3';
const NodeID3 = nodeid3lib.Promise;

import { getInput, parseInput } from './components/getInput.js';
import getDirectories from './components/getDirectories.js';
import getMp3s from './components/getMp3s.js';
import showHelp from './components/showHelp.js';
const config = {};

function displayHelp() {
	const opts = {
		name: "SongLyrics",
		desc: "Scans folders for MP3s, checks if there are mp3s, and adds lyrics if available.",
		usage: [
			"songlyrics [options] <directories...>",
			"lyrics [options] <directories...>"
		],
		options: [
			{
				opt: 'h',
				long: 'help',
				desc: 'Display this help menu.',
			},
			{
				opt: 'e',
				long: 'exclude',
				desc: 'Exclude files or folders matching a specific pattern or path.',
				hint: 'Repeatable'
			},
			{
				opt: 'r',
				long: 'recursive',
				desc: 'Walk through subfolders recursively during the scan.',
				hint: 'Default: false'
			}
		]
	};
	showHelp(opts);
}

const inputs = parseInput();	// inputs.opts.recursive [bool], inputs.dirs [arr]
if(inputs.opts.help) {
	displayHelp();
	process.exit(0);
}
config.excludes = inputs.opts.exclude;
config.recursive = inputs.opts.recursive;

const dirs = getDirectories(inputs.dirs);
const mp3list = getMp3s(dirs, config);

// console.log(inputs);
// console.log(dirs);
// console.log(mp3list.map((mp3,idx) => `${('0'.repeat(4)+idx).substr(-4)} ${mp3}`));



async function checkTag(filepath, i) {
		try {
				const idx = ('0'.repeat(4)+i).substr(-4)
				
				// const tags = await NodeID3.read(filepath);
				const fileBuf = await fs.readFile(filepath);
				const tags = await NodeID3.read(fileBuf);
			
				console.log("--- Audio Metadata ---");
				// console.log(`Index:  ${idx}`);
				console.log(`Title:  ${tags.title || 'N/A'}`);
				console.log(`Artist: ${tags.artist || 'N/A'}`);
				console.log(`Album:  ${tags.album || 'N/A'}`);
				console.log(`Album Artist:  ${tags.performerInfo || 'N/A'}`);
				console.log(`Track:  ${tags.trackNumber || 'N/A'}`);
				console.log(`Genre:  ${tags.genre || 'N/A'}`);
				// console.log(`\n`,tags);
				
				// Raw ID3v2 frames (like TIT2, TPE1) are stored inside tags.raw
				// if (tags.raw) {
					  // console.log(`Raw Title Frame (TIT2): ${tags.raw.TIT2}`);
				// }
				console.log('--- ----- -- ----- ---');
				console.log('');
		} catch (error) {
				console.error("Error reading ID3 tags:", error);
		}
}

async function checkTags(mp3s) {
	// console.time('checkTags');
	for (let i in mp3s) {
		// console.time(`checkTag-${i}`);
		let mp3 = mp3s[i];
		await checkTag(mp3, i);
		// console.timeEnd(`checkTag-${i}`);
	}
	// console.timeEnd('checkTags');
}


checkTags(mp3list);

// time for i in {1..9}; do printf "[%d/9] %s" "${i}" "Loading..."; printf "\r\e[0J[%d/9] %s\n" "${i}" "$(g -r -e "*/.stversions/*" "#{SL2}")"; done