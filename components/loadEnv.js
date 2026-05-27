import dotenv from 'dotenv';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATHS = [
    path.join(os.homedir(), '.config', 'songlyrics', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '.env')
];

for (const envPath of ENV_PATHS) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, quiet: true });
        break; 
    }
}
