import * as fs from 'fs-extra';
import * as path from 'path';
import sqlite3 from 'sqlite3';

// Define the database path
const dbPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.arxiv-downloader', 'papers.db');

// Ensure the directory exists
fs.ensureDirSync(path.dirname(dbPath));

// Initialize the database
const db = new sqlite3.Database(dbPath);

// Migrate the database
async function migrateDatabase() {
  return new Promise<void>((resolve, reject) => {
    // Check if categories column exists
    db.get("PRAGMA table_info(papers)", (err, rows) => {
      if (err) {
        console.error('Error checking table schema:', err);
        reject(err);
        return;
      }

      // Add categories column if it doesn't exist
      db.run("ALTER TABLE papers ADD COLUMN categories TEXT", (err) => {
        if (err) {
          // Column might already exist, which is fine
          console.log('Categories column already exists or error:', err.message);
        } else {
          console.log('Added categories column to papers table');
        }
        resolve();
      });
    });
  });
}

// Run migration
migrateDatabase()
  .then(() => {
    console.log('Database migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database migration failed:', error);
    process.exit(1);
  }); 