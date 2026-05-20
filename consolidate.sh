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
	local bt='```'
	printf "File: %s\n${bt}\n%s\n${bt}\n" "${short}" "$(cat "${file}")"
}

function parseFiles() {
	local file files count i
	files=("$@")
	count="${#files[@]}"
	
	i=0
	for file in "${files[@]}"; do {
		(( i++ ))
		parseFile "$file" "$(getShortPath "${dir_project}" "${file}")"
		if (( i < count )); then printf "\n\n"; fi
	} done
}

function main() {
	local dir dir_project dir_name
	local text_name text_path
	local files file
	text_name="consolidated.js"
	
	if dir_project="$(checkDir "${1:-$PWD}")"; then {
		text_path="${dir_project}/${text_name}"
		mapfile -t files < <(getFiles "${dir_project}")
	} else {
		return 1
	} fi
	
	parseFiles "${files[@]}" | tee "${text_path}" | tee /dev/tty | termux-clipboard-set
}

main "$@"