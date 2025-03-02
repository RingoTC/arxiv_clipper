import chalk from 'chalk';
import { Command } from 'commander';
import { CommandFunction } from '../types';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const migrateCommand: CommandFunction = (program: Command) => {
  program
    .command('migrate')
    .description('Migrate the database schema to the latest version')
    .action(async () => {
      try {
        console.log(chalk.blue('Migrating database schema...'));
        
        // Run the migration script
        const migratePath = path.join(__dirname, '../utils/migrate-db.js');
        await execAsync(`node ${migratePath}`);
        
        console.log(chalk.green('Database migration completed successfully!'));
        console.log(chalk.blue('You can now use the GitHub repository features.'));
      } catch (error) {
        console.error(chalk.red(`Error migrating database: ${(error as Error).message}`));
        process.exit(1);
      }
    });
};

export default migrateCommand; 