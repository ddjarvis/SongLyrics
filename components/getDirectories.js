

const path = require("node:path");

function swapBookmark (bookmark) {
	const bm = {
		SL: "/storage/emulated/0/Music/Song Library",
		SL1: "/storage/emulated/0/Music/Song Library/#1 - Initial",
		SL2: "/storage/emulated/0/Music/Song Library/#2 - Renamed",
		SL3: "/storage/emulated/0/Music/Song Library/#3 - Done"
	}
}

function readInput() {
	if (process.argv.length > 2) {
		const args = [...process.argv].slice(2);
		checkArgs(args);
	} else {
		throw new Error("No arguments provided.")
	}
}

function checkArgs(args = []) {
	args.forEach(arg => {
		const sep = path.sep;
		const segments = arg.split(sep);
	});
	console.log(args);
}


module.exports = function() {
  return [
  	"/storage/emulated/0/Music/Song Library/#1 - Initial/tmp",
  	"/storage/emulated/0/Music/Song Library/#1 - Initial/tmp-new",
  	"/storage/emulated/0/Music/Song Library/#1 - Initial/tmp-boyce",
  ];
}
