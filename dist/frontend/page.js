"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = Home;
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
exports.metadata = {
    title: 'arXiv Downloader - Home',
    description: 'A web interface for managing arXiv papers',
};
function Home() {
    return (<div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <link_1.default href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">arXiv Downloader</span>
            </link_1.default>
          </div>
          <nav className="flex flex-1 items-center justify-end space-x-2">
            <link_1.default href="/papers">
              <button_1.Button variant="ghost">Papers</button_1.Button>
            </link_1.default>
            <link_1.default href="/bibtex">
              <button_1.Button variant="ghost">BibTeX</button_1.Button>
            </link_1.default>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Manage Your arXiv Papers
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Search, organize, and export your research papers with ease.
                </p>
              </div>
              <div className="space-x-4">
                <link_1.default href="/papers">
                  <button_1.Button>
                    Browse Papers
                    <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
                  </button_1.Button>
                </link_1.default>
                <link_1.default href="/bibtex">
                  <button_1.Button variant="outline">Export BibTeX</button_1.Button>
                </link_1.default>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Search Papers</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Find papers by title, author, or content with our powerful search.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Organize by Tags</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Keep your research organized with custom tags and categories.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Export BibTeX</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Generate BibTeX citations for your papers with a single click.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} arXiv Downloader. All rights reserved.
          </p>
        </div>
      </footer>
    </div>);
}
