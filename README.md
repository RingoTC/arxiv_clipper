# arXiv Downloader

A command-line tool for downloading and managing arXiv papers, including both PDF and LaTeX source files.

## Features

- Download papers from arXiv by URL or ID
- Organize papers with tags
- Search and list downloaded papers
- Open PDF and source files
- Delete papers when no longer needed

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/arxiv-downloader.git
cd arxiv-downloader

# Install dependencies
npm install

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

## File Structure

Papers are stored in the `~/Development/arxiv` directory, organized by tags:

```
~/Development/arxiv/
├── default/
│   ├── Paper Title 1/
│   │   ├── paper.pdf
│   │   └── source.tar.gz
│   └── Paper Title 2/
└── machine-learning/
    └── Paper Title 3/
```

## Database

Paper metadata is stored in `~/.arxiv-downloader/papers.json`.

## License

MIT