"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = require("../utils/config");
const cleanCommand = (program) => {
    program
        .command('clean')
        .description('Clean the entire database and remove all stored papers')
        .option('-f, --force', 'Force clean without confirmation', false)
        .action(async (options) => {
        try {
            // Skip confirmation if force option is provided
            if (!options.force) {
                const answers = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: chalk_1.default.red('WARNING: This will delete all papers and reset the database. Continue?'),
                        default: false
                    }
                ]);
                if (!answers.confirm) {
                    console.log(chalk_1.default.yellow('Operation cancelled.'));
                    return;
                }
            }
            // Remove all papers
            console.log(chalk_1.default.gray('Removing all papers...'));
            // Check if papers directory exists
            if (fs_extra_1.default.existsSync(config_1.PAPERS_DIR)) {
                // Remove all subdirectories in the papers directory
                const tagDirs = fs_extra_1.default.readdirSync(config_1.PAPERS_DIR);
                for (const tagDir of tagDirs) {
                    const tagPath = `${config_1.PAPERS_DIR}/${tagDir}`;
                    // Skip if not a directory
                    if (!fs_extra_1.default.statSync(tagPath).isDirectory()) {
                        continue;
                    }
                    // Remove the tag directory and all its contents
                    fs_extra_1.default.removeSync(tagPath);
                    console.log(chalk_1.default.gray(`Removed tag directory: ${tagDir}`));
                }
            }
            // Reset database
            console.log(chalk_1.default.gray('Resetting database...'));
            fs_extra_1.default.writeJsonSync(config_1.DATABASE_PATH, { papers: [] }, { spaces: 2 });
            console.log(chalk_1.default.green('Successfully cleaned all papers and reset the database.'));
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error: ${error.message}`));
            process.exit(1);
        }
    });
};
exports.default = cleanCommand;
