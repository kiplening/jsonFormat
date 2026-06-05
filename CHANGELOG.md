# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0/).

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
