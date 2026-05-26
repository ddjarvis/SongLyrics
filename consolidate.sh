#!/usr/bin/env bash


function getPackage() {
	local dir="$1"
	local package="${dir}/package.json"
	[[ -e "${package}" ]] || return 1
	echo "${package}"
	return 0
}
function getMain() {
	local pkg="$1"
	local main="$(jq -r '.main' < "${pkg}")"
	echo "$main"
	[[ "${main}" != "null" ]] && return 0 || return 2
}
function checkDir() {
	local dir="$1"
	local pkg main hasPkg hasMain
	
	pkg="$(getPackage "${dir}")"
	hasPkg=$?
	
	if ((hasPkg == 0)); then {
		main="$(getMain "${pkg}")"
		hasMain=$?
	} else {
		hasMain=1
	} fi
	
	if ((hasMain != 0)); then {
		[[ -e "${dir}/index.js" ]] || return 1
	} fi
	
	echo "$dir"
	return 0
}

function getFiles() {
	local dir="$1"
	local name="$(basename "${dir}")"
	local regex
	
	printf -v regex "s/%s/%s/\n" "$(sed 's/[./]/\\&/g' <<< "${dir}")" "${name}"
	
	fd -tx -e "js" -e "mjs" -e "cjs" . "${dir}" |\
	awk '{print gsub(/\//,"/"), $0}' |\
	sort -n | cut -d' ' -f2-
}
function getShortPath() {
	local dir="$1"
	local name="$(basename "${dir}")"
	local path="$2"
	local regex
	
	printf -v regex "s/%s/%s/\n" "$(sed 's/[./]/\\&/g' <<< "${dir}")" "${name}"
	
	sed "${regex}" <<< "${path}"
}

function parseFile() {
	local file="$1"
	local short="$2"
	local contents
	local bt='````'
	contents="$(cat "${file}" | perl -pe 's/^\s*(\/\/.+)*(\s+)$//g')"
	printf "File: %s\n${bt}\n%s\n${bt}\n" "${short}" "${contents}"
	
	if (( ${options[quiet]} == 0 && ${options[show]} == 0 )); then {
		printf "File: %s (%s lines)\n" "${short}" "$(wc -l <<< "${contents}")" >/dev/tty
	} fi
}

function parseFiles() {
	local file files count i
	files=("$@")
	count="${#files[@]}"
	
	i=0
	for file in "${files[@]}"; do {
		(( i++ ))
		parseFile "$file" "$(getShortPath "${dir_project}" "${file}")"
		if (( i < count )); then printf "\n"; fi
	} done
}

function join_by() { local d=""; [[ "$1" == "-d" ]] && { d="$2"; shift 2; }; local f=${1-}; shift; printf %s "$f" "${@/#/$d}"; }

function parseArgs() {
	# Options/Arguments Parser (getopt)...
	local show=0
	local quiet=0
	local copy=0
	local filesArr=()
	local files=""
	
	{
		local OPT="$(getopt -o "sa:" -l "show,add:" -- "$@" )"
		eval set -- "${OPT}" && unset OPT
		while true; do {
			case "$1" in
				-s | --show ) show=1; shift ;;
				-c | --copy ) copy=1; shift ;;
				-q | --quiet ) quiet=1; shift ;;
				-a | --add )
					path="$(realpath "$2")"
					[[ -e "${path}" ]] && filesArr+=("${path}")
					shift 2 ;;
				-- ) shift ; break ;;
				* ) shift ;;
			esac
		} done
	}
	(( ${#filesArr[@]} > 0 )) && files="$(join_by -d ":" "${filesArr[@]}")"
	
	declare -Ag options
	options[show]="${show}"
	options[copy]="${copy}"
	options[quiet]="${quiet}"
	options[files]="${files}"
}

function main() {
	local dir dir_project dir_name
	local text_name text_path
	local files file
	local addfiles
	parseArgs "$@"
	text_name="consolidated.js"
	
	if dir_project="$(checkDir "${PWD}")"; then {
		text_path="${dir_project}/${text_name}"
		mapfile -t files < <(getFiles "${dir_project}")
	} else {
		return 1
	} fi
	
	if [[ "${options[files]}" != "" ]]; then {
		IFS=':' read -r -a addfiles <<< "${options[files]}"
		files+=("${addfiles[@]}")
	} fi
	
	parseFiles "${files[@]}" | tee "${text_path}" |\
	{
		if (( ${options[show]} > 0 )); then {
			tee /dev/tty
		} else {
			cat
		} fi
	} |\
	{
		if (( ${options[copy]} > 0 )); then {
			termux-clipboard-set
		} else {
			cat >/dev/null
		} fi
	}
}

main "$@"