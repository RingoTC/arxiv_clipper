import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { Database } from '../types';

// Define paths
const HOME_DIR: string = os.homedir();
const CONFIG_DIR: string = path.join(HOME_DIR, '.arxiv-downloader');
const DATABASE_PATH: string = path.join(CONFIG_DIR, 'papers.json');
const PAPERS_DIR: string = path.join(HOME_DIR, 'Development', 'arxiv');

// Create necessary directories if they don't exist
fs.ensureDirSync(CONFIG_DIR);
fs.ensureDirSync(PAPERS_DIR);

// Initialize database if it doesn't exist
if (!fs.existsSync(DATABASE_PATH)) {
  const emptyDatabase: Database = { papers: [] };
  fs.writeJsonSync(DATABASE_PATH, emptyDatabase, { spaces: 2 });
}

export {
  HOME_DIR,
  CONFIG_DIR,
  DATABASE_PATH,
  PAPERS_DIR
}; 