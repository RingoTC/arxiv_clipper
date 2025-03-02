import * as fs from 'fs-extra';
import * as path from 'path';
import sqlite3 from 'sqlite3';
import { Paper, PaginatedResult } from '../types';

// Define the database path
const dbPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.arxiv-downloader', 'papers.db');

// Ensure the directory exists
fs.ensureDirSync(path.dirname(dbPath));

// Initialize the database
const db = new sqlite3.Database(dbPath);

// Initialize the database schema
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS papers (
      id TEXT PRIMARY KEY,
      title TEXT,
      authors TEXT,
      abstract TEXT,
      categories TEXT,
      pdfUrl TEXT,
      sourceUrl TEXT,
      localPdfPath TEXT,
      localSourcePath TEXT,
      githubUrl TEXT,
      localGithubPath TEXT,
      tag TEXT,
      dateAdded TEXT
    )
  `);
});

// Paper database operations
export const paperDB = {
  // Add a paper to the database
  add: (paper: Paper): Promise<void> => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO papers (id, title, authors, abstract, categories, pdfUrl, sourceUrl, localPdfPath, localSourcePath, githubUrl, localGithubPath, tag, dateAdded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        paper.id,
        paper.title,
        Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors,
        paper.abstract,
        Array.isArray(paper.categories) ? paper.categories.join(', ') : paper.categories,
        paper.pdfUrl,
        paper.sourceUrl,
        paper.localPdfPath || paper.pdfPath,
        paper.localSourcePath || paper.sourcePath,
        paper.githubUrl,
        paper.localGithubPath,
        paper.tag,
        paper.dateAdded || new Date().toISOString(),
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
      
      stmt.finalize();
    });
  },
  
  // Get all papers
  getAll: (): Promise<Paper[]> => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM papers ORDER BY dateAdded DESC', (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows as Paper[]);
      });
    });
  },
  
  // Get papers by tag
  getByTag: (tag: string): Promise<Paper[]> => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM papers WHERE tag = ? ORDER BY dateAdded DESC', [tag], (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows as Paper[]);
      });
    });
  },
  
  // Delete a paper by ID
  delete: (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM papers WHERE id = ?', [id], (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  // Delete papers by tag
  deleteByTag: (tag: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM papers WHERE tag = ?', [tag], (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  // Delete multiple papers by ID
  deletePapers: (ids: string[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      db.run(`DELETE FROM papers WHERE id IN (${placeholders})`, ids, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  // Search papers by keywords
  searchPapers: (keywords: string | string[], tag?: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResult<Paper>> => {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM papers';
      let countQuery = 'SELECT COUNT(*) as total FROM papers';
      const params: string[] = [];
      const countParams: string[] = [];
      
      // Only add search conditions if keywords are provided
      if (keywords && (Array.isArray(keywords) ? keywords.length > 0 : keywords.trim() !== '')) {
        let searchTerms: string[];
        
        if (Array.isArray(keywords)) {
          searchTerms = keywords.map(k => `%${k}%`);
        } else {
          searchTerms = [`%${keywords}%`];
        }
        
        // Build the query with multiple OR conditions for each keyword
        const conditions = searchTerms.map(() => '(title LIKE ? OR authors LIKE ? OR abstract LIKE ? OR id LIKE ?)').join(' OR ');
        query += ` WHERE ${conditions}`;
        countQuery += ` WHERE ${conditions}`;
        
        // Flatten the params array: for each searchTerm, we need 4 parameters (title, authors, abstract, id)
        searchTerms.forEach(term => {
          params.push(term, term, term, term);
          countParams.push(term, term, term, term);
        });
        
        if (tag) {
          query += ' AND tag = ?';
          countQuery += ' AND tag = ?';
          params.push(tag);
          countParams.push(tag);
        }
      } else if (tag) {
        // If only tag is provided
        query += ' WHERE tag = ?';
        countQuery += ' WHERE tag = ?';
        params.push(tag);
        countParams.push(tag);
      }
      
      query += ' ORDER BY dateAdded DESC';
      
      // Add pagination
      const offset = (page - 1) * pageSize;
      query += ' LIMIT ? OFFSET ?';
      params.push(pageSize.toString(), offset.toString());
      
      // First get the total count
      db.get(countQuery, countParams, (countErr: Error | null, countRow: any) => {
        if (countErr) {
          reject(countErr);
          return;
        }
        
        const total = countRow.total;
        
        // Then get the paginated results
        db.all(query, params, (err: Error | null, rows: any[]) => {
          if (err) reject(err);
          else {
            const result: PaginatedResult<Paper> = {
              papers: rows as Paper[],
              total,
              length: rows.length
            };
            resolve(result);
          }
        });
      });
    });
  },
  
  // Get all papers with pagination
  getAllPaginated: (page: number = 1, pageSize: number = 10): Promise<PaginatedResult<Paper>> => {
    return new Promise((resolve, reject) => {
      // First get the total count
      db.get('SELECT COUNT(*) as total FROM papers', [], (countErr: Error | null, countRow: any) => {
        if (countErr) {
          reject(countErr);
          return;
        }
        
        const total = countRow.total;
        const offset = (page - 1) * pageSize;
        
        // Then get the paginated results
        db.all('SELECT * FROM papers ORDER BY dateAdded DESC LIMIT ? OFFSET ?', 
          [pageSize, offset], 
          (err: Error | null, rows: any[]) => {
            if (err) reject(err);
            else {
              const result: PaginatedResult<Paper> = {
                papers: rows as Paper[],
                total,
                length: rows.length
              };
              resolve(result);
            }
          }
        );
      });
    });
  },
  
  // Get papers by tag with pagination
  getByTagPaginated: (tag: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResult<Paper>> => {
    return new Promise((resolve, reject) => {
      // First get the total count
      db.get('SELECT COUNT(*) as total FROM papers WHERE tag = ?', [tag], (countErr: Error | null, countRow: any) => {
        if (countErr) {
          reject(countErr);
          return;
        }
        
        const total = countRow.total;
        const offset = (page - 1) * pageSize;
        
        // Then get the paginated results
        db.all('SELECT * FROM papers WHERE tag = ? ORDER BY dateAdded DESC LIMIT ? OFFSET ?', 
          [tag, pageSize, offset], 
          (err: Error | null, rows: any[]) => {
            if (err) reject(err);
            else {
              const result: PaginatedResult<Paper> = {
                papers: rows as Paper[],
                total,
                length: rows.length
              };
              resolve(result);
            }
          }
        );
      });
    });
  }
}; 