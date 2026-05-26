import { fileURLToPath } from 'url';
import process from 'process';

import {state} from './globals.js';


/**
 * Detects how the current file was executed and updates the state.
 * @param {ImportMeta} [importMeta] - Pass `import.meta` if using ES Modules.
 */
export function setExecutionMode(importMeta) {
  let isMain = false;

  if (importMeta && importMeta.url) {
    // ES Modules check
  	let url = importMeta.url;
  	let file = `file://${process.argv[1]}`;
    // console.log({url,file});
    isMain = importMeta.url === `file://${process.argv[1]}`;
  } else {
    // CommonJS fallback (checks if require is available)
    if (typeof require !== 'undefined' && require.main) {
      isMain = require.main === module;
    }
  }

  // Set the state based on the check
  state.executionMode = isMain ? 'cli' : 'module';
}