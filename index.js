#!/usr/bin/env node

const config = {};
const { getInput, parseInput } = require('./components/getInput');
const getDirectories = require('./components/getDirectories');
const getMp3s = require('./components/getMp3s');

const inputs = parseInput();	// inputs.opts.recursive [bool], inputs.dirs [arr]
config.recursive = inputs.opts.recursive;

const dirs = getDirectories(inputs.dirs);
const mp3s = getMp3s(dirs, config.recursive);


console.log(inputs);
console.log(dirs);


console.log(mp3s);