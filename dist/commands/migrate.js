"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const migrateCommand = (program) => {
    program
        .command('migrate')
        .description('Migrate the database schema to the latest version')
        .action(async () => {
        try {
            console.log(chalk_1.default.blue('Migrating database schema...'));
            // Run the migration script
            const migratePath = path_1.default.join(__dirname, '../utils/migrate-db.js');
            await execAsync(`node ${migratePath}`);
            console.log(chalk_1.default.green('Database migration completed successfully!'));
            console.log(chalk_1.default.blue('You can now use the GitHub repository features.'));
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error migrating database: ${error.message}`));
            process.exit(1);
        }
    });
};
exports.default = migrateCommand;
