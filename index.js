// File: SongLyrics/index.js
import { options, directories, state } from './components/globals.js';
import getDirectories from './components/getDirectories.js';
import getMp3List from './components/getMp3s.js';
import processMp3s from './components/processMp3s.js';
import { setExecutionMode } from './components/executionMode.js';

/**
 * Programmatic entry point for SongLyrics
 * @param {Object} config - CLI options (e.g., recursive, exclude, dry-run)
 * @param {string[]} dirs - Array of directory paths to scan
 */
export default async function (config = {}, dirs = []) {
	if(!state.executionMode) {
		setExecutionMode(import.meta);
		// console.log(state.executionMode); 
	}
	
	// console.log(directories);
	// Merge passed config into the global options object
	// so components that import `options` from globals.js can see them
	Object.assign(options, config);
	// directories.input = [...directories.input, ...dirs];

	const resolvedDirs = getDirectories(directories.input);
	
	const mp3list = getMp3List(resolvedDirs, options);

	if (options.debug) {
		console.log(options);
		console.log(directories);
		// console.log(mp3list);
	}

	await processMp3s(mp3list);
}

// Export individual components for advanced/granular programmatic usage
export { default as getLyrics } from './components/getLyrics.js';
export { default as processMp3s } from './components/processMp3s.js';
export { default as getMp3List } from './components/getMp3s.js';