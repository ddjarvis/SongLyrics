const { program, Command, Option } = require('commander');
const { parseArgs } = require('node:util');

function getInput() {
	const argv = process.argv;
	let args = [];
	if (argv.length > 2) {
		args = [...argv].slice(2);
	}
	return args;
}

function parseInput() {
	const { values, positionals } = parseArgs({
		args: [...process.argv].slice(2),
	  options: {
	    recursive: { type: 'boolean', short: 'r', default: false }
  	},
	  allowPositionals: true
	});
	// console.log({values});
	// console.log({positionals});
	return {
		opts: {
			recursive: values.recursive,
		},
		dirs: positionals
	};
}

module.exports = {
  getInput,
  parseInput
}
