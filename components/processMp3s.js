
import fs from 'node:fs/promises';
import { inspect } from 'node:util';

import nodeid3lib from 'node-id3';
import * as mm from 'music-metadata';
import pLimit from 'p-limit';
import pThrottle from 'p-throttle';
import ora from 'ora';
import chalk from 'chalk';
import cliProgress from 'cli-progress';

import {options, directories} from './globals.js';
import mistral from './mistral.js';

const throttleMistral = pThrottle({
	limit: 1,
	interval: 1300
});
const throttledMistral = throttleMistral(mistral);

function createSafeLogger(progressBar) {
	// This inner function "remembers" the progressBar via closure
	return function logMessage(message) {
		if (typeof progressBar.log === 'function') {
			// Modern cli-progress (v3.8.0+)
			progressBar.log(message);
		} else {
			// Fallback for older versions
			if (process.stdout.clearLine) {
				process.stdout.clearLine(0);
				process.stdout.cursorTo(0);
			}
			console.log(message);
			progressBar.render(); // Force the bar to redraw
		}
	};
}

import getLyrics from './getLyrics.js';


const NodeID3 = nodeid3lib.Promise;

function formatDuration(seconds) {
	if (!seconds && seconds !== 0) return 'N/A';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}
function checkLyrics(tags) {
	// 1. Check if unsynchronized lyrics exist
	if (!tags || !tags.unsynchronisedLyrics) {
		return { hasLyrics: false, isSynced: false, lyricsText: null };
	}

	let lyricsText = '';
	const uslt = tags.unsynchronisedLyrics;

	// node-id3 can return an array of objects, a single object, or a string depending on the file
	if (Array.isArray(uslt)) {
		const primary = uslt.find(u => u && u.text) || uslt[0];
		lyricsText = primary ? (primary.text || '') : '';
	} else if (typeof uslt === 'object' && uslt !== null) {
		lyricsText = uslt.text || '';
	} else if (typeof uslt === 'string') {
		lyricsText = uslt;
	}

	if (!lyricsText.trim()) {
		return { hasLyrics: false, isSynced: false, lyricsText: null };
	}

	// 2. Check for timestamps
	// Split into lines and remove completely empty lines
	const lines = lyricsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
	if (lines.length === 0) {
		return { hasLyrics: true, isSynced: false, lyricsText };
	}

	// Regex to match LRC timestamps like [0:32.28], [00:32], or [12:34.567]
	// It specifically looks for numbers and colons, ignoring ID3 metadata tags like [ar:Artist]
	const timestampRegex = /^\s*\[[0-9]{1,2}:[0-9]{2}(\.[0-9]+)?\]/;
	
	let timestampedLines = 0;
	for (const line of lines) {
		if (timestampRegex.test(line)) {
			timestampedLines++;
		}
	}

	// If more than 50% of the non-empty lines have timestamps, consider it synced
	const isSynced = (timestampedLines / lines.length) > 0.5;

	return {
		hasLyrics: true,
		isSynced,
		lyricsText
	};
}

async function getDuration(path) {
	const mmdata = await mm.parseFile(path);
	const duration = mmdata.format.duration || 0;
	return duration;
}
async function getTags(path) {
	const tags = await NodeID3.read(path);
	return tags;
}
function getData(mp3, tags, duration) {
	const lyricsInfo = checkLyrics(tags);
	let lyricsStatus = 'None';
	let lrcState = 0;
	if (lyricsInfo.hasLyrics) {
		lyricsStatus = lyricsInfo.isSynced ? 'Yes (Synced)' : 'Yes (Unsynced)';
		lrcState = lyricsInfo.isSynced ? 1 : -1;
	}
		
	const data = {
		artist: {
			label: "Artist",
			value: tags.artist || 'N/A',
		},
		title: {
			label: "Title",
			value: tags.title || 'N/A',
		},
		duration: {
			label: "Duration",
			value: formatDuration(duration),
		},
		durationSec: {
			label: "Duration (S)",
			value: duration || 0,
		},
		album: {
			label: "Album",
			value: tags.album || 'N/A',
		},
		albumArtist: {
			label: "Album Artist",
			value: tags.performerInfo || 'N/A',
		},
		track: {
			label: "Track",
			value: tags.trackNumber || 'N/A',
		},
		genre: {
			label: "Genre",
			value: tags.genre || 'N/A',
		},
		lyrics: {
			label: "Lyrics",
			value: lyricsStatus,
		},
		lrcState: {
			label: "LRC",
			value: lrcState,
		},
		path: {
			label: "Path",
			value: mp3 || 'N/A',
		},
	};
	return data;
}
function checkTags(data) {
	try {
		const dataArr = Object.entries(data).filter(d => d[0] !== "durationSec");
		let nameLen = Math.max(...dataArr.map(d => d[1].label.length));
		// console.log(inspect(dataArr),nameLen);
		let metaData = dataArr.map(d => {
			let name = d[1].label;
			let value = d[1].value;
			let line = `${name.padEnd(nameLen)} : ${value}`;
			return line;
		});
		return metaData.join('\n');
	} catch (error) {
		console.error("Error reading ID3 tags:", error);
	}
}

let dbFull = [];
let db = [];

async function readMp3(mp3) {
	try {
		const duration = await getDuration(mp3);
		const tags = await getTags(mp3);
		const data = getData(mp3, tags, duration);
		// dbFull.push(data);
		return data;
	} catch (error) {
		console.error("Error reading ID3 tags:", error);
	}
}
async function readMp3s(mp3s) {
	const spinner = ora({text: "Reading MP3 List.", spinner: "dots"});
	const limit = pLimit(5);
	
	const promises = mp3s.map(mp3 => {
		return limit(() => readMp3(mp3));
	});
	
	const startTime = Date.now();
	spinner.start();
	dbFull = await Promise.all(promises);
	dbFull = dbFull.sort((a,b) => a.path.value.localeCompare(b.path.value));
	db.all = dbFull.map(data => {
		let arr = Object.entries(data);
		let entries = arr.map(d => [d[0], d[1].value]);
		let obj = Object.fromEntries(entries);
		return obj;
	});
	let grp = Object.groupBy(db.all, mp3 => mp3.lrcState);
	// console.log(inspect(db));
	// console.log(inspect(grp));
	// console.log(Object.keys(grp));
	db.lrc = {};
	db.lrc.none = grp["0"];
	db.lrc.unsynced = grp["-1"];
	db.lrc.synced = grp["1"];
	let grpCounts = Object.entries(db.lrc).map(g => `${g[0]}: ${g[1]?.length || 0}`);
	let counts = [`dbFull: ${dbFull.length}`, ...grpCounts].join(', ');
	// console.log(inspect());
	
	// 2. Calculate elapsed time
	const elapsedMs = Date.now() - startTime;
	// 3. Format it (show 'ms' if under a second, otherwise 's')
	const timeStr = elapsedMs < 1000 
		? `${elapsedMs}ms` 
		: `${(elapsedMs / 1000).toFixed(2)}s`;
	spinner.succeed(`Done! (${counts}) [Elapsed: ${timeStr}]\n`);
}

async function processGroup(group) {
	if (!group || group.length === 0) return;

	const progressBar = new cliProgress.SingleBar({
		format: `${chalk.cyan('Fetching Lyrics')} |{bar}| {percentage}% | {value}/{total} Tracks`,
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: true,
		clearOnComplete: true,
		stopOnComplete: true
	});
	
	progressBar.start(group.length, 0);
	const safeLog = createSafeLogger(progressBar);

	const limit = pLimit(5);

	const promises = group.map(mp3 => {
		return limit(async () => {
			try {
				// PASS progressBar HERE
				await processMp3(mp3, safeLog);
			} catch (error) {
				// Also use progressBar.log for errors!
				safeLog(`\n${chalk.red('Error processing:')} ${mp3.artist} - ${mp3.title}\n`);
			} finally {
				progressBar.increment();
			}
		});
	});
	
	await Promise.all(promises);
	console.log('');
}

async function processMp3(mp3, safeLog) {
	let track = `${mp3.artist} - ${mp3.title}`;
	let lrc = null;
	try {
		let tmpLrc = await getLyrics(mp3, safeLog);
		if (tmpLrc.value == null) throw new Error("Empty LRC");
		if(isMostlyCJK(tmpLrc.value)) {
			let transLrc = await throttledMistral(tmpLrc.value);
			if(transLrc == null) throw new Error("Failed to translate LRC");
			lrc = {...tmpLrc, value: transLrc};
		} else {
			lrc = tmpLrc;
		}
	} catch (err) {
		safeLog(`${chalk.redBright.bold('✗ No lyrics for:')} ${track} (${chalk.italic(err.message)})`);
		return
	}
	
	// 1. Define the tags to update
	// node-id3 requires an object with 'language' and 'text' for unsynchronisedLyrics
	const tagsToUpdate = {
		unsynchronisedLyrics: {
			language: "eng", // 3-character ISO 639-2 language code (e.g., 'eng', 'und')
			text: lrc.value  // The plain or LRC formatted lyrics
		}
	};
	
	// --- DRY RUN CHECK ---
	if (options['dry-run']) {
		const log = {
			track: `${track}`,
			type: `${chalk.bold('Type:')} ${lrc.type}`,
			variance: `${chalk.bold('Variance:')} ${lrc.variance}s`,
			status: chalk.yellow.bold('⚠ Dry Run (Skipped Save):')
		};
		safeLog(`${log.status} ${log.track} (${log.type}, ${log.variance})`);
		safeLog(lrc.value);
		return; // Exit early, do not write to file
	}
	
	try {
		// 2. Write the tags to the file
		// mp3.path contains the file path string based on your db.all mapping
		await NodeID3.update(tagsToUpdate, mp3.path);

		const log = {
			track: `${track}`,
			type: `${chalk.bold('Type:')} ${lrc.type}`,
			variance: `${chalk.bold('Variance:')} ${lrc.variance}s`,
			status: chalk.green.bold('✓ Saved:')
		};
		safeLog(`${log.status} ${log.track} (${log.type}, ${log.variance})`);
		
	} catch (err) {
		safeLog(`${chalk.redBright.bold('✗ Failed to save:')} ${track}`);
		safeLog(`  Reason: ${err.message}\n`);
	}
}

function isMostlyCJK(text) {
	// 1. Remove spaces, numbers, punctuation, and symbols to only count actual letters
	const cleanText = text.replace(/[\s\d\p{P}\p{S}]/gu, '');
	
	if (cleanText.length === 0) return false;

	// 2. Match all CJK characters (using the 'g' global flag)
	const cjkRegex = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
	const cjkMatches = cleanText.match(cjkRegex) || [];

	// 3. Check if more than 50% of the letters are CJK (adjust threshold as needed)
	const ratio = cjkMatches.length / cleanText.length;
	return ratio > 0.1; 
}

async function printGroups(mp3s) {
	await readMp3s(mp3s);
	if(db.lrc.synced <= 80) printGroup(`Synced Lyrics`,db.lrc.synced);
	printGroup(`Plain Lyrics`,db.lrc.unsynced);
	printGroup(`No Lyrics`,db.lrc.none);
}
function printGroup(name, group) {
	if(group == null) return;
	const title = `${name}: (${group.length})`;
	console.log(`\n${chalk.cyan.bold(title)}`);
	for(let mp3 of group) {
		let artist = mp3.artist;
		let title = mp3.title;
		let track = `${artist} - ${title}`;
		console.log(` • ${track}`);
	}
}

export default async function(mp3s) {
	// console.time('readMp3s_1');
	// await readMp3s_1(mp3s);
	// console.timeEnd('readMp3s_1');
	// console.time('readMp3s_2');
	await readMp3s(mp3s);
	
	let group = null;
	if (options['recheck']) {
		group = [...db.lrc.none, ...db.lrc.unsynced];
	} else {
		group = [...db.lrc.none];
	}
	await processGroup(group);
	// console.log(inspect(db.lrc, {
	// 	depth: 1,
	// 	maxArrayLength: 5,
	// }));
	// console.log(Array.isArray(db.lrc));
	printGroups(mp3s);
}