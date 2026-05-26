// File: SongLyrics/index.js
import { options, directories } from './components/globals.js';
import getDirectories from './components/getDirectories.js';
import getMp3List from './components/getMp3s.js';
import processMp3s from './components/processMp3s.js';

/**
 * Programmatic entry point for SongLyrics
 * @param {Object} config - CLI options (e.g., recursive, exclude, dry-run)
 * @param {string[]} dirs - Array of directory paths to scan
 */
export default async function (config = {}, dirs = []) {
	// Merge passed config into the global options object
	// so components that import `options` from globals.js can see them
	Object.assign(options, config);
	directories.input = [...directories.input, ...dirs];

	const resolvedDirs = getDirectories(dirs);
	const mp3list = getMp3List(resolvedDirs, config);

	if (options.debug) {
		console.log(options);
		console.log(directories);
	}

	await processMp3s(mp3list);
}

// Export individual components for advanced/granular programmatic usage
export { default as getLyrics } from './components/getLyrics.js';
export { default as processMp3s } from './components/processMp3s.js';
export { default as getMp3List } from './components/getMp3s.js';