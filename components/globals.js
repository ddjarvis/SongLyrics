export const state = {
  executionMode: null
};
export const options = {};
export const directories = {};

export const helpOptions = {
	name: "SongLyrics",
	desc: "Scans folders for MP3s, checks if there are mp3s, and adds lyrics if available.",
	usage: [
		"songlyrics [options] <directories...>"
	],
	options: [
		{
			opt: 'c',
			long: 'recheck',
			desc: 'Recheck mp3s with plain lyrics.',
			hint: 'Default: false'
		}, // -c --recheck
		{
			opt: 'd',
			long: 'dry-run',
			desc: 'Fetch and display lyrics without modifying MP3 files.',
			hint: 'Default: false'
		}, // -d --dry-run
		{
			opt: 'e',
			long: 'exclude',
			value: 'string',
			desc: 'Exclude files or folders matching a specific pattern or path.',
			hint: 'Repeatable'
		}, // -e --exclude
		{
			opt: 'h',
			long: 'help',
			desc: 'Display this help menu.',
		}, // -h --help
		{
			opt: 'q',
			long: 'quiet',
			desc: 'Quiet Mode.',
		}, // -q --quiet
		{
			opt: 'r',
			long: 'recursive',
			desc: 'Walk through subfolders recursively during the scan.',
			hint: 'Default: false'
		}, // -r --recursive
		{
			opt: 's',
			long: 'synced-only',
			desc: 'Only allow synced lyrics.',
			hint: 'Default: false'
		},//  -s --synced-only
		{
			opt: 't',
			long: 'variance',
			value: 'string/number',
			desc: 'Maximum duration variance in seconds.',
			hint: 'Default: 3'
		}, // -t --variance
		{
			opt: 'v',
			long: 'Verbose',
			desc: 'Displays standard lyrics and includes pre/post-transliteration for CJK languages.',
			hint: 'Default: false'
		}, // -v --verbose
		{
			long: 'debug',
			desc: 'Shows debug statements.',
			hint: 'Default: false'
		} // --debug
	]
};
