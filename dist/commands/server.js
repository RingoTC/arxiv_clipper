"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const fs_extra_1 = __importDefault(require("fs-extra"));
const config_1 = require("../utils/config");
// Path to the Next.js app
const WEB_APP_DIR = path_1.default.join(config_1.CONFIG_DIR, 'web-app');
const serverCommand = (program) => {
    program
        .command('server')
        .alias('s')
        .description('Start a web server with a GUI for managing arXiv papers')
        .option('-p, --port <port>', 'Port to run the server on', '3000')
        .action(async (options) => {
        try {
            const port = options.port || '3000';
            // Check if the web app exists
            if (!fs_extra_1.default.existsSync(WEB_APP_DIR)) {
                console.log(chalk_1.default.yellow('Web app not found. Setting up for the first time...'));
                await setupWebApp();
            }
            console.log(chalk_1.default.blue(`Starting web server on port ${port}...`));
            // Start the Next.js development server
            const nextProcess = (0, child_process_1.spawn)('npm', ['run', 'dev', '--', '-p', port], {
                cwd: WEB_APP_DIR,
                stdio: 'inherit',
                shell: true
            });
            // Handle process exit
            nextProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(chalk_1.default.red(`Web server exited with code ${code}`));
                }
            });
            // Handle SIGINT (Ctrl+C)
            process.on('SIGINT', () => {
                console.log(chalk_1.default.yellow('\nShutting down web server...'));
                nextProcess.kill();
                process.exit(0);
            });
        }
        catch (error) {
            console.error(chalk_1.default.red(`Error: ${error.message}`));
            process.exit(1);
        }
    });
};
/**
 * Set up the Next.js web app with shadcn/ui
 */
async function setupWebApp() {
    console.log(chalk_1.default.blue('Setting up Next.js web app with shadcn/ui...'));
    // Create the web app directory
    fs_extra_1.default.ensureDirSync(WEB_APP_DIR);
    // Initialize Next.js project
    console.log(chalk_1.default.gray('Initializing Next.js project...'));
    await runCommand('npx', ['create-next-app@latest', '.', '--typescript', '--tailwind', '--eslint', '--app', '--src-dir', '--import-alias', '@/*'], WEB_APP_DIR);
    // Install shadcn/ui
    console.log(chalk_1.default.gray('Installing shadcn/ui...'));
    await runCommand('npx', ['shadcn-ui@latest', 'init', '--yes'], WEB_APP_DIR);
    // Install additional dependencies
    console.log(chalk_1.default.gray('Installing additional dependencies...'));
    await runCommand('npm', ['install', 'axios', 'react-hook-form', '@hookform/resolvers', 'zod', 'date-fns'], WEB_APP_DIR);
    // Create a symlink to the database
    console.log(chalk_1.default.gray('Creating symlink to database...'));
    const databasePath = path_1.default.join(config_1.CONFIG_DIR, 'papers.json');
    const symlinkPath = path_1.default.join(WEB_APP_DIR, 'src', 'app', 'api', 'papers.json');
    // Ensure the api directory exists
    fs_extra_1.default.ensureDirSync(path_1.default.join(WEB_APP_DIR, 'src', 'app', 'api'));
    // Create the symlink
    try {
        fs_extra_1.default.symlinkSync(databasePath, symlinkPath, 'file');
    }
    catch (error) {
        console.warn(chalk_1.default.yellow(`Could not create symlink: ${error.message}`));
        // Copy the file instead
        fs_extra_1.default.copyFileSync(databasePath, symlinkPath);
    }
    // Copy frontend files
    console.log(chalk_1.default.gray('Copying frontend files...'));
    await copyFrontendFiles();
    console.log(chalk_1.default.green('Web app setup complete!'));
}
/**
 * Copy frontend files to the Next.js app
 */
async function copyFrontendFiles() {
    const frontendDir = path_1.default.join(__dirname, '..', 'frontend');
    // Check if frontend directory exists
    if (!fs_extra_1.default.existsSync(frontendDir)) {
        console.warn(chalk_1.default.yellow('Frontend directory not found. Skipping file copy.'));
        return;
    }
    try {
        // Copy types
        const typesDir = path_1.default.join(WEB_APP_DIR, 'src', 'types');
        fs_extra_1.default.ensureDirSync(typesDir);
        fs_extra_1.default.copyFileSync(path_1.default.join(frontendDir, 'types.ts'), path_1.default.join(typesDir, 'index.ts'));
        // Copy layout
        fs_extra_1.default.copyFileSync(path_1.default.join(frontendDir, 'layout.tsx'), path_1.default.join(WEB_APP_DIR, 'src', 'app', 'layout.tsx'));
        // Copy home page
        fs_extra_1.default.copyFileSync(path_1.default.join(frontendDir, 'page.tsx'), path_1.default.join(WEB_APP_DIR, 'src', 'app', 'page.tsx'));
        // Copy papers page
        const papersDir = path_1.default.join(WEB_APP_DIR, 'src', 'app', 'papers');
        fs_extra_1.default.ensureDirSync(papersDir);
        fs_extra_1.default.copyFileSync(path_1.default.join(frontendDir, 'papers', 'page.tsx'), path_1.default.join(papersDir, 'page.tsx'));
        // Copy bibtex page
        const bibtexDir = path_1.default.join(WEB_APP_DIR, 'src', 'app', 'bibtex');
        fs_extra_1.default.ensureDirSync(bibtexDir);
        fs_extra_1.default.copyFileSync(path_1.default.join(frontendDir, 'bibtex', 'page.tsx'), path_1.default.join(bibtexDir, 'page.tsx'));
        // Copy API routes
        const apiDir = path_1.default.join(WEB_APP_DIR, 'src', 'app', 'api');
        const paperApiDir = path_1.default.join(apiDir, 'papers');
        fs_extra_1.default.ensureDirSync(paperApiDir);
        fs_extra_1.default.copyFileSync(path_1.default.join(frontendDir, 'api', 'papers', 'route.ts'), path_1.default.join(paperApiDir, 'route.ts'));
        // Create theme provider component
        await setupThemeProvider();
        // Install shadcn components
        await installShadcnComponents();
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error copying frontend files: ${error.message}`));
    }
}
/**
 * Set up the theme provider component
 */
async function setupThemeProvider() {
    const componentsDir = path_1.default.join(WEB_APP_DIR, 'src', 'components');
    fs_extra_1.default.ensureDirSync(componentsDir);
    // Add theme provider
    await runCommand('npx', ['shadcn-ui@latest', 'add', 'theme-provider'], WEB_APP_DIR);
}
/**
 * Install shadcn components
 */
async function installShadcnComponents() {
    const components = [
        'button',
        'input',
        'card',
        'badge',
        'checkbox',
        'label',
        'select',
        'textarea'
    ];
    for (const component of components) {
        console.log(chalk_1.default.gray(`Installing ${component} component...`));
        await runCommand('npx', ['shadcn-ui@latest', 'add', component], WEB_APP_DIR);
    }
}
/**
 * Run a command in a specific directory
 */
async function runCommand(command, args, cwd) {
    return new Promise((resolve, reject) => {
        const process = (0, child_process_1.spawn)(command, args, {
            cwd,
            stdio: 'inherit',
            shell: true
        });
        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
    });
}
exports.default = serverCommand;
