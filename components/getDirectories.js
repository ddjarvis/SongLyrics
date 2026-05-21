import path from "node:path";
import fs from "node:fs";
import os from "node:os";

// 1. Define the config file name
const CONFIG_FILE_NAME = 'bookmarks.json';

// 2. Define the search paths in order of priority
const CONFIG_PATHS = [
	path.join(os.homedir(), '.config', 'songlyrics', CONFIG_FILE_NAME), // ~/.config/songlyrics/bookmarks.json
	path.join(process.cwd(), CONFIG_FILE_NAME)                         // Project folder / Current Working Directory
];

// 3. Fallback defaults (always loaded)
const DEFAULT_BOOKMARKS = {
	SL:  "/storage/emulated/0/Music/Song Library",
	SL1: "/storage/emulated/0/Music/Song Library/#1 - Initial",
	SL2: "/storage/emulated/0/Music/Song Library/#2 - Renamed",
	SL3: "/storage/emulated/0/Music/Song Library/#3 - Done"
};

// Cache the bookmarks so we don't read the file system on every single swap
let bookmarksCache = null;

function loadBookmarks() {
	// Always start with a fresh copy of the default bookmarks
	let finalBookmarks = { ...DEFAULT_BOOKMARKS };

	// Look for the config file in the defined paths
	for (const configPath of CONFIG_PATHS) {
		if (fs.existsSync(configPath)) {
			try {
				const rawData = fs.readFileSync(configPath, 'utf-8');
				const fileBookmarks = JSON.parse(rawData);
				
				// Merge: file bookmarks overwrite defaults, but defaults remain if not in file
				finalBookmarks = { ...finalBookmarks, ...fileBookmarks };
				break; // Stop after finding and loading the first valid config file
			} catch (err) {
				console.warn(`Warning: Found config at ${configPath} but could not parse it. Using defaults.`);
				break;
			}
		}
	}

	return finalBookmarks;
}

function swapBookmark(bookmark) {
	if (!bookmarksCache) {        bookmarksCache = loadBookmarks();
	}
	return bookmarksCache[bookmark];
}

function readInput() {
	if (process.argv.length > 2) {
		const args = [...process.argv].slice(2);
		checkArgs(args);
	} else {
		throw new Error("No arguments provided.");
	}
}

function checkArgs(args) {
	// Fixed syntax: arg =>
	args = args.map(arg => checkArg(arg)).flat();
	return args;
}

function checkArg(arg) {
	// Fixed syntax: removed space in lookbehind (?<=) and fixed regBrace typo
	const regBm = /(?<=(^|\/))\s*#{[^}]+}\s*(?=($|\/))/g;
	const regBrace = /{{[^}]+,[^}]+}}/g; 
	
	let hasBrace = false, hasBm = false;
	let allBm = [], allBraces = [];
	const sep = path.sep;
	const segments = arg.split(sep);

	hasBm = segments.some(seg => regBm.test(seg));
	hasBrace = segments.some(seg => regBrace.test(seg));

	if(hasBrace) {
		allBraces = arg.match(regBrace);
		
		let args = [];
		args.push(arg);
		
		allBraces.forEach(brace => {
			let tmp = args.map(a => parseBraces(a, brace));
			args = tmp.flat();
		});
		args = args.map(a => checkArg(a));
		return args.flat();
	}

	if(hasBm) {
		allBm = arg.match(regBm).map(bm => bm.trim());
		allBm.forEach(bm => {            arg = parseBm(arg, bm);
		});
	}
	return arg;
}

function parseBraces(arg, brace) {
	let vals = brace.replace(/({{)|(}})/g,'')
		.split(',')
		// Fixed syntax: x =>
		.map(x => x.trim())
		.filter(x => !!x && x !== '');
		
	let args = vals.map(val => arg.replace(brace, val));
	return args;
}

function parseBm(arg, bm) {
	bm = bm.replace(/\s*#{\s*([^}]+?)\s*}\s*/,'$1');
	try {
		const val = swapBookmark(bm);
		if (!val) throw new Error("Not found in config");
		return arg.replace('#{'+bm+'}', val);
	}
	catch(err) {
		throw new Error(`Invalid BM: ${bm}`);
	}
}

function getDirectories(args) {
	let dirs = checkArgs(args);
	dirs = dirs.filter(arg => {
		if (isDir(arg)) {
			return true;
		} else {
			return false;
		}
	});
	return dirs;
}

function isDir(dirPath) {
	try {
		return fs.statSync(dirPath).isDirectory();
	} catch (err) {
		return false;
	}
}

export default function(args = []) {
	if(args.length === 0) { throw new Error("no args"); }
	let dirs = getDirectories(args);
	if(dirs.length > 0) {
		return dirs;
	} else {
		throw new Error("no dirs");
	}
}