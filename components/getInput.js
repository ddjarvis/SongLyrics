import { program, Command, Option } from 'commander';
import { parseArgs } from 'node:util';

export function getInput() {
	const argv = process.argv;
	let args = [];
	if (argv.length > 2) {
		args = [...argv].slice(2);
	}
	return args;
}

export function parseInput() {
	const { values, positionals } = parseArgs({
		args: [...process.argv].slice(2),
	  options: {
	  	help: { type: 'boolean', short: 'h', default: false },
	    exclude: { type: 'string', short: 'e', multiple: true, default: [] },
	    recursive: { type: 'boolean', short: 'r', default: false }
  	},
	  allowPositionals: true
	});
	// console.log({values});
	// console.log({positionals});
	return {
		opts: values,
		dirs: positionals
	};
}