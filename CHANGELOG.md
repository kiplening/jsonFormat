# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0/).

## [Unreleased]

### Added
- **2048** (`game-2048.html`): the sliding-tile puzzle as a third page, sharing the
  header, nav, and theme switcher. Keyboard (arrows / WASD / HJKL), touch swipe,
  undo (up to 20 moves), best score, and automatic resume of an in-progress game
  via `localStorage`. Slide and merge animations honour `prefers-reduced-motion`.
- 67 tests covering the game's pure logic (line sliding and merging, all four
  directions, win/game-over detection, random spawning, keyboard handling, and
  persistence), bringing the suite to 188 tests.

### Fixed
- `run-tests.js` resolves the source files relative to its own directory instead of
  a hardcoded absolute path, so the suite runs from any checkout.

## [1.0.0] - 2026-06-05

First tagged release.

### Added
- **JSON Formatter**: format, minify, validate, collapsible tree view, search with
  highlighting, adjustable indentation, file upload, and copy/download.
- Performance escape hatches for large JSON — lazy rendering of big arrays/objects
  and virtual scroll for multi-MB files.
- **URL Tool**: encode/decode URLs, component breakdown (protocol, domain, port,
  path, hash), and query-parameter extraction as formatted JSON.
- Shared dark/light theme switcher and editor-style split layout.
- Automated test suite (121 tests, Node.js built-ins only).

### Changed
- URL Tool component fields (protocol, domain, port, path, hash) now display on a
  single line, truncating long values with an ellipsis.
- Hovering a component value shows its full content via tooltip.

### Removed
- Per-field "Copy" buttons in the URL Tool, replaced with **double-click to copy**.
