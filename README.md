# JSON & URL Tools

A pair of fast, dependency-free, single-page developer tools that run entirely in the browser — no build step, no server, no tracking.

## Tools

### JSON Formatter (`index.html`)
- Format, minify, and validate JSON
- Collapsible tree view with expand/collapse
- Search with match highlighting
- Adjustable indentation
- File upload and one-click copy/download
- Optimized for large files (lazy rendering + virtual scroll for multi-MB documents)

### URL Tool (`url-tool.html`)
- Encode and decode URLs
- Breaks a URL into its components — protocol, domain, port, path, hash
- **Double-click any component to copy it**; hover to see the full value
- Extracts query parameters as formatted JSON

Both tools share a dark/light theme switcher and an editor-style split layout.

## Usage

No installation required — just open the HTML files in a browser:

```bash
open index.html      # JSON Formatter
open url-tool.html   # URL Tool
```

## Development

This is a plain HTML/CSS/JS project with no build step, package manager, or linter.

```bash
# Run the test suite (121 tests, Node.js built-ins only)
node run-tests.js

# Generate large test data for performance testing (~2.8MB JSON)
node generate-test-data.js
```

See [CLAUDE.md](CLAUDE.md) for architecture notes and [CHANGELOG.md](CHANGELOG.md) for the release history.
