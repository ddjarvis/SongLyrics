

const path = require("node:path");
const fs = require("node:fs");

function swapBookmark (bookmark) {
	const bm = {
		SL: "/storage/emulated/0/Music/Song Library",
		SL1: "/storage/emulated/0/Music/Song Library/#1 - Initial",
		SL2: "/storage/emulated/0/Music/Song Library/#2 - Renamed",
		SL3: "/storage/emulated/0/Music/Song Library/#3 - Done"
	}
	return bm[bookmark];
}
function readInput() {
	if (process.argv.length > 2) {
		const args = [...process.argv].slice(2);
		checkArgs(args);
	} else {
		throw new Error("No arguments provided.")
	}
}
function checkArgs(args) {
	args = args.map(arg => checkArg(arg)).flat();
	return args;
}
function checkArg(arg) {
	const regBm = /(?<=(^|\/))\s*#\{[^}]+\}\s*(?=($|\/))/g;
	const regBrace = /\{\{[^}]*,[^}]*\}\}/g;
	let hasBrace = false, hasBookmark = false;
	let allBm = [], allBraces = [];
	
	const sep = path.sep;
	const segments = arg.split(sep);
	
	hasBm = segments.some(seg => regBm.test(seg));
	hasBrace = segments.some(seg => regBrace.test(seg));
	
	// console.log({
	// 	arg,
	// 	type: typeof arg,
	// 	hasBm,
	// 	hasBrace
	// });
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
		allBm.forEach(bm => {
			arg = parseBm(arg, bm);
		})
	}
	return arg;
}
function parseBraces(arg, brace) {
	let vals = brace.replace(/(\{\{)|(\}\})/g,'')
		.split(',')
		.map(x => x.trim())
		.filter(x =>!!x && x!='')
	let args = vals.map(val => arg.replace(brace, val));
	return args;
}
function parseBm(arg, bm) {
	bm = bm.replace(/\s*#\{\s*([^}]+?)\s*\}\s*/,'$1');
	try {
		const val = swapBookmark(bm);
		return arg.replace('#{'+bm+'}', val);
	}
	catch(err) {
		throw new Error(`Invalid BM: ${bm}`);
	}
}

function getDiretories(args) {
	let dirs = checkArgs(args);
	dirs = dirs.filter(arg => {
		// console.log('Dir: '+arg);
		if (isDir(arg)) {
			// console.log('isDir: true');
			return true;
		} else {
			// console.log('isDir: false');
			return false;
		}
		// console.log('');
	});
	return dirs;
}

function isDir(path) {
	try {
		return fs.statSync(path).isDirectory();
	} catch (err) {
		return false;
	}
}

module.exports = function(args = []) {
	if(args.length == 0) { throw new Error("no args"); }
	
	let dirs = getDiretories(args);
	if(dirs.length > 0) {
		return dirs;
	} else {
		throw new Error("no dirs");
	}
}
