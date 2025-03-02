"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const sqlite3_1 = __importDefault(require("sqlite3"));
// Define the database path
const dbPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.arxiv-downloader', 'papers.db');
// Ensure the directory exists
fs.ensureDirSync(path.dirname(dbPath));
// Initialize the database
const db = new sqlite3_1.default.Database(dbPath);
// Migrate the database
async function migrateDatabase() {
    return new Promise((resolve, reject) => {
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
                }
                else {
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
