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
exports.paperDB = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const sqlite3_1 = __importDefault(require("sqlite3"));
// Define the database path
const dbPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.arxiv-downloader', 'papers.db');
// Ensure the directory exists
fs.ensureDirSync(path.dirname(dbPath));
// Initialize the database
const db = new sqlite3_1.default.Database(dbPath);
// Initialize the database schema
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS papers (
      id TEXT PRIMARY KEY,
      title TEXT,
      authors TEXT,
      abstract TEXT,
      pdfUrl TEXT,
      sourceUrl TEXT,
      localPdfPath TEXT,
      localSourcePath TEXT,
      tag TEXT,
      dateAdded TEXT
    )
  `);
});
// Paper database operations
exports.paperDB = {
    // Add a paper to the database
    add: (paper) => {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
        INSERT OR REPLACE INTO papers (id, title, authors, abstract, pdfUrl, sourceUrl, localPdfPath, localSourcePath, tag, dateAdded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(paper.id, paper.title, Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors, paper.abstract, paper.pdfUrl, paper.sourceUrl, paper.localPdfPath || paper.pdfPath, paper.localSourcePath || paper.sourcePath, paper.tag, paper.dateAdded || new Date().toISOString(), (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
            stmt.finalize();
        });
    },
    // Get all papers
    getAll: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM papers ORDER BY dateAdded DESC', (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    },
    // Get papers by tag
    getByTag: (tag) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM papers WHERE tag = ? ORDER BY dateAdded DESC', [tag], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    },
    // Delete a paper by ID
    delete: (id) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM papers WHERE id = ?', [id], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    },
    // Delete papers by tag
    deleteByTag: (tag) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM papers WHERE tag = ?', [tag], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    },
    // Delete multiple papers by ID
    deletePapers: (ids) => {
        return new Promise((resolve, reject) => {
            const placeholders = ids.map(() => '?').join(',');
            db.run(`DELETE FROM papers WHERE id IN (${placeholders})`, ids, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    },
    // Search papers by keywords
    searchPapers: (keywords, tag) => {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM papers';
            const params = [];
            // Only add search conditions if keywords are provided
            if (keywords && (Array.isArray(keywords) ? keywords.length > 0 : keywords.trim() !== '')) {
                let searchTerms;
                if (Array.isArray(keywords)) {
                    searchTerms = keywords.map(k => `%${k}%`);
                }
                else {
                    searchTerms = [`%${keywords}%`];
                }
                // Build the query with multiple OR conditions for each keyword
                const conditions = searchTerms.map(() => '(title LIKE ? OR authors LIKE ? OR abstract LIKE ? OR id LIKE ?)').join(' OR ');
                query += ` WHERE ${conditions}`;
                // Flatten the params array: for each searchTerm, we need 4 parameters (title, authors, abstract, id)
                searchTerms.forEach(term => {
                    params.push(term, term, term, term);
                });
                if (tag) {
                    query += ' AND tag = ?';
                    params.push(tag);
                }
            }
            else if (tag) {
                // If only tag is provided
                query += ' WHERE tag = ?';
                params.push(tag);
            }
            query += ' ORDER BY dateAdded DESC';
            db.all(query, params, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
};
