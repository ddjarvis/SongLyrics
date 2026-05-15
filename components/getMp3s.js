const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

/**
 * Recursively finds all .mp3 files in a given directory (sync)
 */
function findMp3sInDirSync(dirPath, recursive = true) {
  let results = [];
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      if (item.isDirectory() && recursive) {
        results = results.concat(findMp3sInDirSync(fullPath));
      } else if (item.isFile() && path.extname(item.name).toLowerCase() === '.mp3') {
        results.push(fullPath);
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read directory ${dirPath}:`, err.message);
  }
  return results;
}

/**
 * Accepts an array of directory paths and returns all MP3 files found
 */
function getAllMp3sSync(directories, recursive = false) {
  let allMp3s = [];
  for (const dir of directories) {
    // Resolve to absolute path to avoid issues
    const resolvedDir = path.resolve(dir);
    if (!fs.existsSync(resolvedDir)) {
      console.warn(`Directory does not exist: ${resolvedDir}`);
      continue;
    }
    const mp3s = findMp3sInDirSync(resolvedDir, recursive);
    allMp3s = allMp3s.concat(mp3s);
  }
  return allMp3s;
}

// Usage
// const dirs = ['./music', './downloads/audio'];
// const mp3Files = getAllMp3sSync(dirs);
// console.log('Result:', mp3Files);

module.exports = function(directories, recursive = false) {
	if(directories.length == 0) { throw new Error("No Directories Provided"); }
	return getAllMp3sSync(directories, recursive);
}