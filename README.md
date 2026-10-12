# JSON & URL Tools

A set of fast, dependency-free, single-page developer tools — plus a game of 2048 for breaks — that run entirely in the browser. No build step, no server, no tracking.

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

### 2048 (`game-2048.html`)
- The classic sliding-tile puzzle on a 4×4 board
- Play with arrow keys, <kbd>WASD</kbd>, <kbd>HJKL</kbd>, or swipe on touch screens
- Undo (<kbd>U</kbd> or <kbd>Ctrl/⌘ Z</kbd>, up to 20 moves) and <kbd>R</kbd> for a new game
- Best score and an in-progress game are saved in `localStorage`, so a reload resumes where you left off
- Slide/merge animations that respect `prefers-reduced-motion`

All three pages share the header, navigation, and dark/light theme switcher; the two tools use an editor-style split layout.

## Usage

No installation required — just open the HTML files in a browser:

```bash
open index.html       # JSON Formatter
open url-tool.html    # URL Tool
open game-2048.html   # 2048
```

## Development

This is a plain HTML/CSS/JS project with no build step, package manager, or linter.

```bash
# Run the test suite (188 tests, Node.js built-ins only)
node run-tests.js

# Generate large test data for performance testing (~2.8MB JSON)
node generate-test-data.js
```

See [CLAUDE.md](CLAUDE.md) for architecture notes and [CHANGELOG.md](CHANGELOG.md) for the release history.
