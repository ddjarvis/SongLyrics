
import fs from 'node:fs/promises';
import nodeid3lib from 'node-id3';
const NodeID3 = nodeid3lib.Promise;


async function checkTag(filepath) {
		try {
				// const tags = await NodeID3.read(filepath);
				const fileBuf = await fs.readFile(filepath);
				const tags = await NodeID3.read(fileBuf);
			
				// console.log(`Index:  ${idx}`);
				let metaData = []
				metaData.push(`Title:  ${tags.title || 'N/A'}`);
				metaData.push(`Artist: ${tags.artist || 'N/A'}`);
				metaData.push(`Album:  ${tags.album || 'N/A'}`);
				metaData.push(`Album Artist:  ${tags.performerInfo || 'N/A'}`);
				metaData.push(`Track:  ${tags.trackNumber || 'N/A'}`);
				metaData.push(`Genre:  ${tags.genre || 'N/A'}`);
				return metaData.join('\n');
				// console.log(`\n`,tags);
				
				// Raw ID3v2 frames (like TIT2, TPE1) are stored inside tags.raw
				// if (tags.raw) {
					  // console.log(`Raw Title Frame (TIT2): ${tags.raw.TIT2}`);
				// }
				
		} catch (error) {
				console.error("Error reading ID3 tags:", error);
		}
}

export default async function(mp3s) {
	let i = 0;
	for (let mp3 of mp3s) {
		// console.time(`checkTag-${i}`);
		i++;
		let meta = await checkTag(mp3);
		console.log(`--- Audio Metadata (${i}/${mp3s.length}) ---`);
		console.log(meta);
		console.log('--- ----- -- ----- ---');
		console.log('');
		// console.timeEnd(`checkTag-${i}`);
	}
}