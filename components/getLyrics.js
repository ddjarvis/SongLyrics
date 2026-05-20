
import pThrottle from 'p-throttle';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function (mp3) {
	let url = getUrl(mp3);
	console.log(`${mp3.artist} - ${mp3.title}\n${url}`);
	let rawJson = await fetchLyrics(url);
	if(rawJson != null) console.log('Success!');
	let filtered = filterLyrics(rawJson, mp3.durationSec)
	await sleep(500);
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
function filterLyrics(json, dur) {
	let filtered = null;
	const variance_threshold = 3;
	filtered = json
		.filter(j => j.syncedLyrics != null)
		.filter(j => Math.abs(j.duration - dur) <= variance_threshold);
	console.log(`Raw: ${json.length}\nFiltered: ${filtered.length}`);
}