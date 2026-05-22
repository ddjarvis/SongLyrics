import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {options, directories} from './globals.js';


function matchWildcard(str, pattern) {
	// Input validation
	if (typeof str !== 'string' || typeof pattern !== 'string') {
		return false;
	}

	// Escape special regex characters in the pattern, except for '*'
	// We replace every character that is special in Regex with its escaped version
	// But we handle '*' separately later.
	const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

	// Replace '*' with '.*' to match any sequence of characters
	// Note: We do this AFTER escaping other special chars so that '*' itself isn't escaped
	const regexPattern = '^' + escapedPattern.replace(/\*/g, '.*') + '$';

	// Create a case-insensitive RegExp
	const regex = new RegExp(regexPattern, 'i');

	return regex.test(str);
}

/**
 * Recursively finds all .mp3 files in a given directory (sync)
 */
function findMp3sInDirSync(dirPath, opts) {
	const { recursive, exclude: excludes } = {
		recursive: false,
		exclude: [],
		...options
	};
	if(options['debug']) {
		console.log({ recursive, excludes });
	}
	let results = [];
	let push = false;
	
	try {
		const items = fs.readdirSync(dirPath, { withFileTypes: true });
		for (const item of items) {
			const fullPath = path.join(dirPath, item.name);
			let result
			if (item.isDirectory() && recursive) {
				results = results.concat(findMp3sInDirSync(fullPath, opts));
			} else if (item.isFile() && path.extname(item.name).toLowerCase() === '.mp3') {
				if (excludes.length == 0) { push = true; }
				else {
					let hasExcludes = excludes.some(e => matchWildcard(fullPath,e));
					push = !hasExcludes;
					if(options['debug']) {
						let pre = null;
						if(hasExcludes) pre = 'Excluding';
						if(!hasExcludes) pre = 'Not Excluding';
						console.log(`${pre}: ${fullPath}`);
					}
					// console.log({excludes, hasExcludes, fullPath, push});
					// console.log({res: results ? results.length : 0});
				}
				if(!push) { continue; }
				results.push(fullPath);
			}
		}
	} catch (err) {
		console.warn(`Warning: Could not read directory ${dirPath}:`, err.message);
	}
	return results.sort((a,b) => a.localeCompare(b));
}


/**
 * Accepts an array of directory paths and returns all MP3 files found
 */
function getAllMp3sSync(directories, opts) {
	let allMp3s = [];
	for (const dir of directories) {
		// Resolve to absolute path to avoid issues
		const resolvedDir = path.resolve(dir);
		if (!fs.existsSync(resolvedDir)) {
			console.warn(`Directory does not exist: ${resolvedDir}`);
			continue;
		}
		const mp3s = findMp3sInDirSync(resolvedDir, opts);
		allMp3s = allMp3s.concat(mp3s);
	}
	return allMp3s;
}

// Usage
// const dirs = ['./music', './downloads/audio'];
// const mp3Files = getAllMp3sSync(dirs);
// console.log('Result:', mp3Files);

export default function(directories, opts = {}) {
	if(directories.length == 0) { throw new Error("No Directories Provided"); }
	return getAllMp3sSync(directories, opts);
}