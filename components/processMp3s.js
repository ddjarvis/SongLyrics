
import fs from 'node:fs/promises';
import nodeid3lib from 'node-id3';
import * as mm from 'music-metadata';
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

async function getDuration(fileBuffer) {
	const mmdata = await mm.parseBuffer(fileBuffer);
	const duration = mmdata.format.duration || 0;
	return duration;
}
async function getTags(fileBuffer) {
	const tags = await NodeID3.read(fileBuffer);
	return tags;
}
function getData(tags, duration) {
	const lyricsInfo = checkLyrics(tags);
	let lyricsStatus = 'None';
	if (lyricsInfo.hasLyrics) {
		lyricsStatus = lyricsInfo.isSynced ? 'Yes (Synced)' : 'Yes (Unsynced)';
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
	};
	return data;
}
function checkTags(data) {
	try {
		const dataArr = Object.entries(data).filter(d => d[0] !== "durationSec");
		let nameLen = Math.max(dataArr.map(d => d[1].label.length));

		let metaData = dataArr.map(d => {
			let name = d[1].label;
			let value = d[1].value;
			let line = `${name.padStart(nameLen)} : ${value}`;
			return line;
		});
		return metaData.join('\n');
	} catch (error) {
		console.error("Error reading ID3 tags:", error);
	}
}
async function processMp3(mp3) {
	try {
		const buffer = await fs.readFile(mp3);
		const duration = await getDuration(buffer);
		const tags = await getTags(buffer);
		const data = getData(tags, duration);
		const meta = checkTags(data);
		return meta;
	} catch (error) {
		console.error("Error reading ID3 tags:", error);
	}
}

async function processMp3s(mp3s) {
	let i = 0;
	for (let mp3 of mp3s) {
		i++;
		let meta = await processMp3(mp3);
		console.log(`--- Audio Metadata (${i}/${mp3s.length}) ---`);
		console.log(meta);
		console.log('--- ----- -- ----- ---');
		console.log('');
	}
}

export default async function(mp3s) {
	await processMp3s(mp3s);
}