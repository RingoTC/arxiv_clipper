# arXiv Downloader

A command-line tool for downloading and managing arXiv papers, including both PDF and LaTeX source files. Built with TypeScript for better maintainability and type safety.

## Features

- Download papers from arXiv by URL or ID
- Organize papers with tags
- Search and list downloaded papers
- Open PDF and source files
- Delete papers when no longer needed
- Clean the entire database and remove all stored papers
- Export BibTeX citations for papers

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/arxiv-downloader.git
cd arxiv-downloader

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Link the command globally
npm link
```

## Usage

The tool provides several commands for managing arXiv papers:

### Download a paper

```bash
# Download a paper with the default tag
adown https://arxiv.org/abs/2007.12324

# Download a paper with a specific tag
adown https://arxiv.org/abs/2007.12324 -t machine-learning
```

### List papers

```bash
# List all papers
adown ls

# Search papers by keywords
adown ls context knowledge

# List papers by tag
adown ls -t knowledge-tracing
```

### Delete papers

```bash
# Search and delete a paper
adown delete context knowledge

# Delete all papers with a specific tag
adown delete -t knowledge-tracing

# Force delete without confirmation
adown delete -t knowledge-tracing -f
```

### Open paper files

```bash
# Open source files of a paper
adown source context knowledge

# Open PDF of a paper
adown pdf context knowledge
```

### Export BibTeX citations

```bash
# Export BibTeX for papers matching search terms
adown bibtex context knowledge

# Export BibTeX for papers with a specific tag
adown bibtex -t machine-learning

# Export BibTeX for all papers without selection
adown bibtex -a

# Export BibTeX to a file
adown bibtex -o citations.bib
```

### Clean database and files

```bash
# Clean the entire database and remove all stored papers (with confirmation)
adown clean

# Force clean without confirmation
adown clean -f
```

## File Structure

Papers are stored in the `~/Development/arxiv` directory, organized by tags:

```
~/Development/arxiv/
├── default/
│   ├── Paper Title 1/
│   │   ├── paper.pdf
│   │   ├── source.tar.gz
│   │   └── citation.bib
│   └── Paper Title 2/
└── machine-learning/
    └── Paper Title 3/
```

## Project Structure

```
arxiv-downloader/
├── src/                  # TypeScript source files
│   ├── index.ts          # Entry point
│   ├── commands/         # Command implementations
│   └── utils/            # Utility functions
├── dist/                 # Compiled JavaScript files
├── package.json          # Project configuration
└── tsconfig.json         # TypeScript configuration
```

## Database

Paper metadata is stored in `~/.arxiv-downloader/papers.json`.

## Development

```bash
# Install development dependencies
npm install

# Run TypeScript compiler in watch mode
npm run dev

# Run linting
npm run lint

# Run tests
npm run test
```

## License

MIT