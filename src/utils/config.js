const path = require('path');
const os = require('os');
const fs = require('fs-extra');

// Define paths
const HOME_DIR = os.homedir();
const CONFIG_DIR = path.join(HOME_DIR, '.arxiv-downloader');
const DATABASE_PATH = path.join(CONFIG_DIR, 'papers.json');
const PAPERS_DIR = path.join(HOME_DIR, 'Development', 'arxiv');

// Create necessary directories if they don't exist
fs.ensureDirSync(CONFIG_DIR);
fs.ensureDirSync(PAPERS_DIR);

// Initialize database if it doesn't exist
if (!fs.existsSync(DATABASE_PATH)) {
  fs.writeJsonSync(DATABASE_PATH, { papers: [] }, { spaces: 2 });
}

module.exports = {
  HOME_DIR,
  CONFIG_DIR,
  DATABASE_PATH,
  PAPERS_DIR
}; 