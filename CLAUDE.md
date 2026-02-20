# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests (121 tests, no dependencies required)
node run-tests.js

# Generate large test data for performance testing (~2.8MB JSON)
node generate-test-data.js

# Open the app in a browser
open index.html
open url-tool.html
```

There is no build step, package manager, or linter — this is a plain HTML/CSS/JS project.

## Architecture

Two independent single-page tools, each with its own HTML/CSS/JS:

- **JSON Formatter** (`index.html` + `script.js` + `styles.css`): `JSONFormatter` class instantiated on `DOMContentLoaded`.
- **URL Tool** (`url-tool.html` + `url-tool.js` + `url-tool.css`): `URLTool` class instantiated on `DOMContentLoaded`.

Navigation between the two tools is via plain `<a href>` links in the header.

### JSON Formatter rendering strategy

`formatJSON()` always calls `renderCollapsibleJSON()`, which builds a DOM tree using `buildCollapsibleElement()` recursively. There is no innerHTML templating for the tree — it uses `appendChild` and `createElement` throughout.

Two performance escape hatches kick in automatically:
- **Large arrays/objects (>100 items)**: `buildLazyArray` / `buildLazyObject` — renders items in chunks of 50 on demand via a "Load more" button.
- **Large files (>500 KB)**: `onIndentChange` and `clearSearchHighlight` fall back to `renderSimpleJSON`, which uses `syntaxHighlight` (regex-based HTML string) and `renderLazyJSON` (virtual scroll) for files over 1000 lines.

`minifyJSON()` is the only path that sets `output.textContent` directly — all other render paths build the DOM tree.

### Testing approach

`run-tests.js` uses only Node.js built-ins. It loads the browser classes via the `Function` constructor with a minimal DOM shim (stub elements, no jsdom). Pure-logic methods (`syntaxHighlight`, `formatBytes`, `findAllMatches`, `escapeHtml`, `getLineAndColumn`, `isValidJSON`) are tested by calling them on instantiated objects. DOM-mutating methods (`formatJSON`, `minifyJSON`) are tested by inspecting stub element state after the call.

### Key behaviours to preserve

- `escapeHtml` works by setting `div.textContent` and reading `div.innerHTML` — it requires a DOM `createElement` shim to function correctly in tests.
- `copyToClipboard` and `downloadJSON` both re-serialize from `this.currentData` (not from the DOM), so they always produce clean JSON regardless of the current render mode.
- The `localStorage` key `testJSON` is checked on load in `index.html` to pre-populate the input — used for manual testing workflows.
- `.json` files are gitignored — test data must be generated locally with `generate-test-data.js`.
