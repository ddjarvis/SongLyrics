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
			opt: 'h',
			long: 'help',
			desc: 'Display this help menu.',
		},
		{
			opt: 'e',
			long: 'exclude',
			value: 'string',
			desc: 'Exclude files or folders matching a specific pattern or path.',
			hint: 'Repeatable'
		},
		{
			opt: 'v',
			long: 'variance',
			value: 'string/number',
			desc: 'Maximum variance in seconds.',
			hint: 'Default: 3'
		},
		{
			opt: 's',
			long: 'synced-only',
			desc: 'Only allow synced lyrics.',
			hint: 'Default: false'
		},
		{
			opt: 'r',
			long: 'recursive',
			desc: 'Walk through subfolders recursively during the scan.',
			hint: 'Default: false'
		},
		{
			opt: 'd',
			long: 'debug',
			desc: 'Shows debug statements.',
			hint: 'Default: false'
		}
	]
};