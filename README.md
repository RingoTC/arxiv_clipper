# arXiv Downloader (adown)

A command-line tool for downloading and managing arXiv papers, including both PDF and LaTeX source files.

## Features

- Download papers from arXiv by URL
- Organize papers with tags
- List and search your paper collection
- Export BibTeX citations
- Web interface for managing papers and BibTeX export

## Installation

```bash
npm install -g arxiv-downloader
```

## Usage

### Download a paper

```bash
adown https://arxiv.org/abs/2101.12345
```

Or with a tag:

```bash
adown https://arxiv.org/abs/2101.12345 -t machine-learning
```

### List papers

```bash
adown list
```

Filter by tag:

```bash
adown list -t machine-learning
```

Search by terms:

```bash
adown list neural networks
```

### Export BibTeX

Command line export:

```bash
adown bibtex -a  # Export all papers
adown bibtex -t machine-learning  # Export papers with a specific tag
adown bibtex neural networks  # Export papers matching search terms
```

### Web Interface for BibTeX Export

Start the web interface for BibTeX export:

```bash
adown bibtex-web
```

This will start a local web server and open your browser. The web interface allows you to:

- Search papers by title, author, or abstract
- Filter papers by tag
- Select papers individually or all at once
- Preview BibTeX entries
- Copy BibTeX to clipboard
- Export BibTeX to a file

You can specify a custom port:

```bash
adown bibtex-web -p 8080
```

### Comprehensive Web Interface

Start the comprehensive web interface for managing all your arXiv papers:

```bash
adown web
```

This will start a local web server and open your browser. The web interface provides a complete management system for your papers:

- **List Management**:
  - View all your papers in a clean, organized interface
  - Search papers by title, author, or abstract
  - Filter papers by tag
  - Delete papers individually or in bulk
  - Open PDF files directly from the interface
  - Extract and view LaTeX source files
  - Export BibTeX citations directly from the list view
  - Preview, copy, or download BibTeX entries for selected papers

- **Paper Download**:
  - Download new papers from arXiv URLs
  - Add tags during download for better organization

You can specify a custom port:

```bash
adown web -p 8080
```

### Other Commands

```bash
adown --help  # Show help
adown pdf 2101.12345  # Open PDF for a paper
adown source 2101.12345  # Extract LaTeX source
adown delete 2101.12345  # Delete a paper
adown clean  # Clean up temporary files
```

## License

MIT