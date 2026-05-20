import chalk from 'chalk';
import { Table, printTable } from 'console-table-printer';
const { log } = console;


function canStringify(input) {
	return (input === null || typeof input == 'number' || typeof input == 'string' || typeof input == 'object');
}
function xtrim(input) {
	if(input === null) { return ''; }
	let type = typeof input;
	let isArr = type == 'object' ? Array.isArray(input) : false;
	switch (type) {
		case 'number':
			return input.toString();
			break;
		case 'string':
			return input.replace(/ +/g,' ').trim();
			break;
		case 'object':
			let out
			if (isArr) {
				let arr = input;
				let valid = arr.every(x => canStringify(x));
				if(!valid) { throw new Error("Invalid xtrim target."); }
				out = arr.filter(x => (x != '') && (x !== null)).map(x => xtrim(x));
			} else {
				let obj = Object.entries(input);
				let valid = obj
					.map(o => o[1])
					.every(x => canStringify(x));
				if(!valid) { throw new Error("Invalid xtrim target."); }
				out = Object.fromEntries(obj.filter(o => (o[1] != '') && (o[1] !== null)).map(o => [o[0], xtrim(o[1])]));
			}
			return out;
			break;
		default:
			throw new Error("Invalid xtrim target.")
	}
}
let prog = {
	name: 'ProgramName',
	desc: 'This is the program description. Lorem ipsum dolor sit amet...',
	usage: [],
	commands: [],
	options: [],
	examples: []
};

const colors = {
	base: ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'],
	fg: {},
	bg: {}
}
{
	colors.fg.base = colors.base;
	colors.fg.bright = colors.fg.base.map(c => c+'Bright');
	colors.fg.all = [...colors.fg.base, ...colors.fg.bright];
	colors.bg.base = colors.base.map(c => 'bg'+c.charAt(0).toUpperCase()+c.substr(1).toLowerCase());
	colors.bg.bright = colors.bg.base.map(c => c+'Bright');
	colors.bg.all = [...colors.bg.base, ...colors.bg.bright];

	colors.fb = [];
	for (let bg of colors.bg.base) {
		for (let fg of colors.fg.bright) {
			colors.fb.push({fg, bg});
		}
	}
}

const theme = {
	title: chalk.bold.underline.hex('#61AFEF'),
	header: chalk.bold.hex('#61AFEF'),
	command: chalk.bold.hex('#98C379'),
	flag: chalk.hex('#98C379'),
	description1: chalk.hex('#E3E5E9'),
	description2: chalk.hex('#ABB2BF'),
	hint: chalk.hex('#9D9CDF')
	// hint: chalk.hex('#5C6370')
};

function showHelp(opts = {}) {
	const { name, desc, usage, commands, options, ...opt } = {...prog, ...opts};
	let table;
	
	log(`${name}\n${desc}`);
	
	if (usage.length > 0) {
		log('');
		log(theme.header('Usage:'));
		usage.forEach(u => log(u));
	}
	
	if (commands.length > 0) {
		const t = new Table({
			style: {
				vertical: ' ',
			},
			columns: [
				{ name: 'cmd', alignment: 'left', title: 'Command' },
				{ name: 'desc', alignment: 'left', title: 'Description', maxLen: 55 },
			],
		});
		const rows = commands.map(c => {
			let cmd = c.flags;
			let desc = c.desc;
			let obj = { cmd, desc };
			return obj;
		});
		t.addRows(rows);
		let table = t.render().split('\n').slice(3,-1).join('\n');
		
		log('');
		log(theme.header('Commands:'));
		log(table);
		// commands.forEach(c => log(`${c.cmd}\t${c.desc}`));
	}
	
	if (options.length > 0) {
		const t = new Table({
			style: {
				vertical: ' ',
			},
			columns: [
				{ name: 'flags', alignment: 'left', title: 'Flags' },
				{ name: 'desc', alignment: 'left', title: 'Description', maxLen: 55 },
			],
		});
		const rows = options.map(o => {
			let flags = o.flags;
			let desc = o.desc;
			let obj = { flags, desc };
			return obj;
		});
		t.addRows(rows);
		let table = t.render().split('\n').slice(3,-1).join('\n');
		
		log('');
		log(theme.header('Options:'));
		log(table);
		// options.forEach(o => log(`${o.flags}\t${o.desc}`));
	}
	
	log('');
}

function processHelpOptions(args = {}) {
	const { name, desc, usage, commands, options, ...opts } = {...prog, ...xtrim(args)}
	let temp;
	const out = {};
	
	if (!!name) {
		out.name = theme.title(name);
	}
	if (!!desc) {
		out.desc = theme.description1(desc);
	}
	if (usage.length > 0) {
		out.usage = usage.map(u => theme.description2('  ◦ ' +u));
	}
	if (commands.length > 0) {
		out.commands = commands
			.sort((a,b) => {
				let strA = a.cmd;
				let strB = b.cmd;
				return strA.localeCompare(strB);
			})
			.map(c => {
				let cmd = theme.command(c.cmd);
				let desc = theme.description2(c.desc);
				let obj = { cmd, desc };
				return obj;
			});
	}
	if (options.length > 0) {
		out.options = options
			.sort((a,b) => {
				let strA = a.opt || a.long;
				let strB = b.opt || b.long;
				return strA.localeCompare(strB);
			})
			.map(o => {
				let regex = /(^\s*\(\s*)|(\s*\)\s*$)/g;
				let flags = [
					!!o.opt ? theme.flag('-'+o.opt) : '',
					!!o.long ? theme.flag('--'+o.long) : '',
				].filter(f => !!f).join(', ')
				+(!!o.value ? theme.flag(` <${o.value}>`) : '');
				let hint = !!o.hint ? o.hint.replace(regex,'') : '';
				let desc = [
					theme.description2(o.desc),
					!!hint ? theme.hint(`(${hint})`) : ''
				].filter(d => !!d).join(' ');
				let obj = { flags, desc };
				return obj;
			});
	}
	
	return out;
}

export default function(opts = {}) {
	const processedOpts = processHelpOptions(opts);
	showHelp(processedOpts);
}