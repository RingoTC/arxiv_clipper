import { Command } from 'commander';

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  publishedDate: string;
  updatedDate: string;
  url: string;
  tag?: string;
  pdfPath?: string;
  sourcePath?: string;
  bibtexPath?: string;
  bibtex?: string;
  downloadDate?: string;
  pdfUrl?: string;
  sourceUrl?: string;
  localPdfPath?: string;
  localSourcePath?: string;
  githubUrl?: string;
  localGithubPath?: string;
  dateAdded?: string;
  arxivId?: string;
}

export interface PaginatedResult<T> {
  papers: T[];
  total: number;
  length?: number;
}

export interface Database {
  papers: Paper[];
}

export interface CommandOptions {
  tag?: string;
  force?: boolean;
  output?: string;
  all?: boolean;
  github?: string;
  page?: number;
  pageSize?: number;
}

export type CommandFunction = (program: Command) => void; 