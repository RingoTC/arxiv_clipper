declare module 'path';
declare module 'os';
declare module 'fs-extra';
declare module 'mkdirp';
declare module 'inquirer';
declare module 'child_process';

declare module '*.json' {
  const value: any;
  export default value;
}

// Declare missing command modules
declare module './commands/list';
declare module './commands/delete';
declare module './commands/source';
declare module './commands/pdf';
declare module './commands/clean';
declare module './commands/bibtex'; 