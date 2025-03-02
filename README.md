# arXiv Downloader (adown)

A command-line tool for downloading and managing arXiv papers, including both PDF and LaTeX source files.

## Features

- Download papers from arXiv by URL
- Download associated GitHub repositories
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

With a tag:

```bash
adown https://arxiv.org/abs/2101.12345 -t machine-learning
```

With a GitHub repository:

```bash
adown https://arxiv.org/abs/2101.12345 --github https://github.com/username/repository
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

### Open paper directories

Open the parent directory containing all files for a paper:

```bash
adown open 2101.12345
```

Open the LaTeX source directory:

```bash
adown open 2101.12345 --source
```

Open the GitHub repository directory:

```bash
adown open 2101.12345 --github
```

Open the entire knowledge base:

```bash
adown open-kb
```

### Export BibTeX

Command line export:

```bash
adown bibtex -a  # Export all papers
adown bibtex -t machine-learning  # Export papers with a specific tag
adown bibtex neural networks  # Export papers matching search terms
```

### Web Interface

Start the web interface for managing all your arXiv papers:

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
  - Open GitHub repositories associated with papers
  - Edit paper details, including GitHub repository URLs
  - Export BibTeX citations directly from the list view
  - Preview, copy, or download BibTeX entries for selected papers
  - Open the entire knowledge base directory

- **Paper Download**:
  - Download new papers from arXiv URLs
  - Add GitHub repository URLs during download
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
adown migrate  # Migrate database schema to support GitHub repositories
```

## Troubleshooting

### GitHub Repository Issues

If you encounter errors related to GitHub repositories, such as:
- `table papers has no column named githubUrl`
- Issues with paths containing spaces when cloning repositories

Run the database migration command to update your schema:

```bash
adown migrate
```

This will add the necessary columns to your database to support GitHub repository functionality.

## License

MIT

## Development

### Testing

The project uses Jest for unit testing. To run the tests:

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Building

To build the project:

```bash
npm run build
```

This will compile TypeScript files and copy template files to the dist directory.

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request