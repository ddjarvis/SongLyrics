#!/usr/bin/env node

const getDirectories = require('./components/getDirectories');

const dirs = getDirectories();

console.log(dirs);