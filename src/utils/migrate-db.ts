import * as fs from 'fs-extra';
import * as path from 'path';
import sqlite3 from 'sqlite3';

// Define the database path
const dbPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.arxiv-downloader', 'papers.db');

// Ensure the directory exists
fs.ensureDirSync(path.dirname(dbPath));

// Initialize the database
const db = new sqlite3.Database(dbPath);

// Define column info type
interface ColumnInfo {
  name: string;
  type: string;
}

// Check if columns exist and add them if they don't
db.serialize(() => {
  // Check if githubUrl column exists
  db.all("PRAGMA table_info(papers)", (err, rows: ColumnInfo[]) => {
    if (err) {
      console.error('Error checking database schema:', err);
      process.exit(1);
    }

    // Check if the columns exist
    const hasGithubUrl = rows && rows.some((row) => row.name === 'githubUrl');
    const hasLocalGithubPath = rows && rows.some((row) => row.name === 'localGithubPath');

    // Add columns if they don't exist
    if (!hasGithubUrl) {
      console.log('Adding githubUrl column to papers table...');
      db.run('ALTER TABLE papers ADD COLUMN githubUrl TEXT', (err) => {
        if (err) {
          console.error('Error adding githubUrl column:', err);
        } else {
          console.log('Successfully added githubUrl column');
        }
      });
    }

    if (!hasLocalGithubPath) {
      console.log('Adding localGithubPath column to papers table...');
      db.run('ALTER TABLE papers ADD COLUMN localGithubPath TEXT', (err) => {
        if (err) {
          console.error('Error adding localGithubPath column:', err);
        } else {
          console.log('Successfully added localGithubPath column');
        }
      });
    }

    console.log('Database migration completed');
  });
}); 