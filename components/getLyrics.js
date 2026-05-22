
import { inspect } from 'node:util';
import pThrottle from 'p-throttle';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const throttle = pThrottle({
	limit: 1,
	interval: 300
});
const throttledFetchLyrics = throttle(fetchLyrics);

export default async function (mp3, safeLog) {
	let track = `${mp3.artist} - ${mp3.title}`
	let url = getUrl(mp3);
	
	// await sleep(300);
	try {
		let rawJson = await throttledFetchLyrics(url);
	} catch(error) {
		throw new Error(error);
	}
	if (rawJson == null) {
		let err = 'Empty JSON Response';
		throw new Error(err);
	}
	
	const parsedJson = parseJson(rawJson, mp3.durationSec, safeLog);
	if (parsedJson.length == 0) {
		let err = 'Empty Parsed JSON';
		throw new Error(err);
	}
	
	const selectedJson = parsedJson[0];
	const hasSynced = selectedJson.syncedLyrics != null;
	const plainLrc = selectedJson.plainLyrics;
	
	let value = null;
	let type = null;
	let variance = Math.round(Math.abs(mp3.durationSec - selectedJson.duration) * 1000) / 1000;
	if (hasSynced) {
		type = 'Synced';
		value = selectedJson.syncedLyrics;
	} else {
		type = 'Plain';
		value = selectedJson.plainLyrics;
	}
	const obj = {type, value, variance};
	
	return obj;
	// console.log(`Track: ${track}\nRaw: ${rawJson.length}\nParsed: ${parsedJson.length}\n`);
}

function getUrl(mp3) {
	let artist = encodeURIComponent(mp3.artist.trim());
	let title = encodeURIComponent(mp3.title.trim());
	let url = `https://lrclib.net/api/search?artist_name=${artist}&track_name=${title}`;
	return url;
}

async function fetchLyrics(url) {
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			}
		});
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}\nURL: ${url}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Fetch failed:", error);
	}
}
function parseJson(json, dur, safeLog) {
	const VARIANCE_THRESHOLD = 3;
	const WEIGHT_VARIANCE = 100;
	const WEIGHT_SYNCED = 60;
	const MINIMUM_LINES = 8;
	
	const filteredJson = json
		.filter(j => Math.abs(j.duration - dur) <= VARIANCE_THRESHOLD)
		.filter(j => {
			const hasSynced = !!j.syncedLyrics
				? j.syncedLyrics.split('\n').length > MINIMUM_LINES : false;
			const hasPlain = !!j.plainLyrics
				? j.plainLyrics.split('\n').length > MINIMUM_LINES : false;
			// safeLog({hasSynced, hasPlain});
			return hasSynced || hasPlain;
		})
	const scoredJson = filteredJson.map(j => {
		const variance = Math.abs(j.duration - dur);
		const normalized = Math.max(0, 1 - (variance / VARIANCE_THRESHOLD));
		const varianceScore = normalized * WEIGHT_VARIANCE;
		
		const hasSynced = j.syncedLyrics != null;
		const syncedScore = hasSynced ? WEIGHT_SYNCED : 0;
		
		let score = (varianceScore + syncedScore) > WEIGHT_SYNCED
			? (varianceScore + syncedScore) : 0;
		
		const obj = {score, json: j};
		
		return obj;
	});
	const sortedJson = scoredJson.sort((a,b) => b.score - a.score);
	const finalJson = sortedJson
		.filter(j => j.score > WEIGHT_SYNCED)
		.map(j => j.json);
	// console.log(inspect(finalJson));
	// console.log(finalJson);
	return finalJson;
}

