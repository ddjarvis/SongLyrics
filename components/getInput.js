import { program, Command, Option } from 'commander';
import { parseArgs } from 'node:util';

import {options, directories} from './globals.js';



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
	  	debug: { type: 'boolean', short: 'd', default: false },
	    exclude: { type: 'string', short: 'e', multiple: true, default: [] },
	  	help: { type: 'boolean', short: 'h', default: false },
	    recursive: { type: 'boolean', short: 'r', default: false },
	    variance: { type: 'string', short: 'v', default: '3' },
	    "synced-only": { type: 'boolean', short: 's', default: false }
  	},
	  allowPositionals: true
	});
	Object.keys(values).forEach(key => {
		options[key] = values[key];
	});
	directories.input = positionals;
	// console.log(options);
	// console.log({positionals});
	return {
		opts: values,
		dirs: positionals
	};
}