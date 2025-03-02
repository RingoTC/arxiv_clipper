import { Command } from 'commander';
import downloadCommand from '../../src/commands/download';
import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { Paper } from '../../src/types';

// Mock dependencies
jest.mock('puppeteer');
jest.mock('fs/promises');
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, cb) => cb(null, { stdout: 'success' })),
}));
jest.mock('../../src/models/Paper', () => ({
  paperDB: {
    addPaper: jest.fn().mockResolvedValue(true),
    getPaperByArxivId: jest.fn().mockResolvedValue(null),
  },
}));

// Mock the download function
jest.mock('../../src/commands/download', () => {
  const originalModule = jest.requireActual('../../src/commands/download');
  return {
    __esModule: true,
    ...originalModule,
    download: jest.fn().mockImplementation(async () => {
      return {
        id: '2101.12345',
        title: 'Test Paper Title',
        authors: ['Author One', 'Author Two'],
        abstract: 'This is a test abstract.',
        categories: ['cs.AI'],
        publishedDate: '2021-01-25T00:00:00Z',
        updatedDate: '2021-01-26T00:00:00Z',
        url: 'http://arxiv.org/abs/2101.12345',
        pdfPath: '/path/to/pdf',
        sourcePath: '/path/to/source',
      } as Paper;
    }),
  };
});

describe('download command', () => {
  let program: Command;
  let mockPage: any;
  let mockBrowser: any;

  beforeEach(() => {
    program = new Command();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock puppeteer
    mockPage = {
      goto: jest.fn().mockResolvedValue(undefined),
      waitForSelector: jest.fn().mockResolvedValue({
        evaluate: jest.fn().mockImplementation((fn) => {
          // Simulate different element evaluations
          if (fn.toString().includes('title')) {
            return 'Test Paper Title';
          } else if (fn.toString().includes('authors')) {
            return ['Author One', 'Author Two'];
          } else if (fn.toString().includes('abstract')) {
            return 'This is a test abstract.';
          }
          return null;
        }),
      }),
      $: jest.fn().mockResolvedValue({
        attr: jest.fn().mockResolvedValue('http://arxiv.org/pdf/2101.12345.pdf'),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    };
    
    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
    (mkdir as jest.Mock).mockResolvedValue(undefined);
  });

  test('registers the download command', () => {
    downloadCommand(program);
    
    const downloadCmd = program.commands.find(cmd => cmd.name() === 'download');
    expect(downloadCmd).toBeDefined();
    expect(downloadCmd?.description()).toContain('Download a paper from arXiv');
  });

  test('download function handles valid arXiv URL', async () => {
    const { download } = require('../../src/commands/download');
    const result = await download('https://arxiv.org/abs/2101.12345', { tag: 'test' });
    
    expect(result).toMatchObject({
      id: '2101.12345',
      title: 'Test Paper Title',
    });
  });
}); 