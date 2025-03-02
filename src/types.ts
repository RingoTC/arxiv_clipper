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
  dateAdded?: string;
  arxivId?: string;
}

export interface Database {
  papers: Paper[];
}

export interface CommandOptions {
  tag?: string;
  force?: boolean;
  output?: string;
  all?: boolean;
}

export type CommandFunction = (program: Command) => void; 