"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAPERS_DIR = exports.DATABASE_PATH = exports.CONFIG_DIR = exports.HOME_DIR = void 0;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// Define paths
const HOME_DIR = os_1.default.homedir();
exports.HOME_DIR = HOME_DIR;
const CONFIG_DIR = path_1.default.join(HOME_DIR, '.arxiv-downloader');
exports.CONFIG_DIR = CONFIG_DIR;
const DATABASE_PATH = path_1.default.join(CONFIG_DIR, 'papers.json');
exports.DATABASE_PATH = DATABASE_PATH;
const PAPERS_DIR = path_1.default.join(HOME_DIR, 'Development', 'arxiv');
exports.PAPERS_DIR = PAPERS_DIR;
// Create necessary directories if they don't exist
fs_extra_1.default.ensureDirSync(CONFIG_DIR);
fs_extra_1.default.ensureDirSync(PAPERS_DIR);
// Initialize database if it doesn't exist
if (!fs_extra_1.default.existsSync(DATABASE_PATH)) {
    const emptyDatabase = { papers: [] };
    fs_extra_1.default.writeJsonSync(DATABASE_PATH, emptyDatabase, { spaces: 2 });
}
