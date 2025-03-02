import { Command } from 'commander';
import { logger } from '../src/utils/logger';

// Mock dependencies
jest.mock('commander', () => {
  const mockCommand = {
    name: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
    arguments: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    action: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    parse: jest.fn().mockReturnThis(),
    commands: [],
    outputHelp: jest.fn(),
  };
  
  return {
    Command: jest.fn().mockImplementation(() => mockCommand),
  };
});

jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  generateTraceId: jest.fn().mockReturnValue('test-trace-id'),
  setTraceId: jest.fn(),
}));

// Mock all command modules
jest.mock('../src/commands/download', () => jest.fn());
jest.mock('../src/commands/list', () => jest.fn());
jest.mock('../src/commands/delete', () => jest.fn());
jest.mock('../src/commands/source', () => jest.fn());
jest.mock('../src/commands/pdf', () => jest.fn());
jest.mock('../src/commands/clean', () => jest.fn());
jest.mock('../src/commands/bibtex', () => jest.fn());
jest.mock('../src/commands/bibtex-web', () => jest.fn());
jest.mock('../src/commands/open', () => jest.fn());
jest.mock('../src/commands/migrate', () => jest.fn());

describe('CLI', () => {
  let originalProcessArgv: string[];
  
  beforeEach(() => {
    // Save original process.argv
    originalProcessArgv = process.argv;
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original process.argv
    process.argv = originalProcessArgv;
    
    // Clear module cache to ensure fresh import
    jest.resetModules();
  });
  
  test('initializes CLI with correct configuration', () => {
    // Set up test arguments
    process.argv = ['node', 'script.js'];
    
    // Import the CLI module
    require('../src/index');
    
    // Get the Command instance
    const CommandConstructor = Command as jest.MockedClass<typeof Command>;
    const commandInstance = CommandConstructor.mock.results[0].value;
    
    // Verify CLI setup
    expect(commandInstance.name).toHaveBeenCalledWith('adown');
    expect(commandInstance.description).toHaveBeenCalledWith(
      expect.stringContaining('arXiv papers')
    );
    expect(commandInstance.version).toHaveBeenCalled();
    
    // Verify logger initialization
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Starting arXiv Downloader CLI'),
      expect.any(Object)
    );
  });
  
  test('registers all commands', () => {
    // Set up test arguments
    process.argv = ['node', 'script.js'];
    
    // Import the CLI module
    const downloadCommand = require('../src/commands/download');
    const listCommand = require('../src/commands/list');
    const deleteCommand = require('../src/commands/delete');
    const sourceCommand = require('../src/commands/source');
    const pdfCommand = require('../src/commands/pdf');
    const cleanCommand = require('../src/commands/clean');
    const bibtexCommand = require('../src/commands/bibtex');
    const webCommand = require('../src/commands/bibtex-web');
    const openCommand = require('../src/commands/open');
    const migrateCommand = require('../src/commands/migrate');
    
    require('../src/index');
    
    // Verify all commands are registered
    expect(downloadCommand).toHaveBeenCalled();
    expect(listCommand).toHaveBeenCalled();
    expect(deleteCommand).toHaveBeenCalled();
    expect(sourceCommand).toHaveBeenCalled();
    expect(pdfCommand).toHaveBeenCalled();
    expect(cleanCommand).toHaveBeenCalled();
    expect(bibtexCommand).toHaveBeenCalled();
    expect(webCommand).toHaveBeenCalled();
    expect(openCommand).toHaveBeenCalled();
    expect(migrateCommand).toHaveBeenCalled();
  });
}); 