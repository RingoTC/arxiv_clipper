import path from 'path';
import os from 'os';
import fs from 'fs-extra';

// Define paths
const HOME_DIR: string = os.homedir();
const CONFIG_DIR: string = path.join(HOME_DIR, '.arxiv-downloader');
const PAPERS_DIR: string = path.join(HOME_DIR, 'Development', 'arxiv');

// Create necessary directories if they don't exist
fs.ensureDirSync(CONFIG_DIR);
fs.ensureDirSync(PAPERS_DIR);

export {
  HOME_DIR,
  CONFIG_DIR,
  PAPERS_DIR
}; 