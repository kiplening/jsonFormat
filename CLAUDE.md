# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests (193 tests, no dependencies required)
node run-tests.js

# Generate large test data for performance testing (~2.8MB JSON)
node generate-test-data.js

# Open the apps in a browser
open index.html
open url-tool.html
open game-2048.html
```

There is no build step, package manager, or linter — this is a plain HTML/CSS/JS project.

## Architecture

Three independent single pages, each with its own HTML/CSS/JS:

- **JSON Formatter** (`index.html` + `script.js` + `styles.css`): `JSONFormatter` class instantiated on `DOMContentLoaded`.
- **URL Tool** (`url-tool.html` + `url-tool.js` + `url-tool.css`): `URLTool` class instantiated on `DOMContentLoaded`.
- **2048** (`game-2048.html` + `game-2048.js` + `game-2048.css`): `Game2048` class instantiated on `DOMContentLoaded`.

Navigation between the pages is via plain `<a href>` links in the header. Each CSS file carries its own copy of the shared shell styles (theme tokens, header, nav, toolbar, buttons, toast) — there is no shared stylesheet, so a shell change must be applied to all three. `theme.js` is the only shared script (theme toggle).

### JSON Formatter rendering strategy

`formatJSON()` always calls `renderCollapsibleJSON()`, which builds a DOM tree using `buildCollapsibleElement()` recursively. There is no innerHTML templating for the tree — it uses `appendChild` and `createElement` throughout.

Two performance escape hatches kick in automatically:
- **Large arrays/objects (>100 items)**: `buildLazyArray` / `buildLazyObject` — renders items in chunks of 50 on demand via a "Load more" button.
- **Large files (>500 KB)**: `onIndentChange` and `clearSearchHighlight` fall back to `renderSimpleJSON`, which uses `syntaxHighlight` (regex-based HTML string) and `renderLazyJSON` (virtual scroll) for files over 1000 lines.

`minifyJSON()` is the only path that sets `output.textContent` directly — all other render paths build the DOM tree.

### 2048 game structure

Game state is a plain 4×4 array of numbers (`0` = empty). The pure logic is DOM-free and takes grids as arguments:
- `slideRow(row)` compacts and merges one line toward index 0, returning `{ row, score, moved, sources }` — `sources[i]` lists the original indices that landed in position `i` (two indices = a merge).
- `computeMove(grid, direction)` applies `slideRow` to every line via `cellFor(direction, k, p)` (which maps slide coordinates onto the grid) and returns `{ grid, score, moved, moves }`. `moves` holds one `{ from, to, value, merged }` trajectory per tile and is what drives the slide animation.
- `canMove`, `hasWon`, `getEmptyCells`, `addRandomTile(grid)` (mutates; 90% 2 / 10% 4 via the injectable `this.rng`).

`move(direction)` is the only mutating entry point during play: it pushes history, swaps in the new grid, spawns a tile, updates `won`/`over`, saves state, then calls `render(anim)`. `render` draws tiles at their old positions, slides them with a CSS `transform` transition (positions are the `--x`/`--y` custom properties), and after `slideDuration` redraws the final grid with `tile-merged` / `tile-new` classes. `finishAnimation()` flushes an in-flight slide so rapid key presses are never dropped.

Persistence uses two `localStorage` keys: `game2048Best` and `game2048State` (grid, score, won, keepPlaying, over). A saved game that is `over` or fails `isValidGrid` is discarded on load.

Board sizing is CSS-only: `.game-main` is a size container (`container-type: size`) and `.game` derives `--board` from `100cqw`/`100cqh`, so the board is always the largest square that fits the space left after the header, toolbar, and hint. The ≤768px media query switches the container off (the page scrolls there, so the container has no fixed height) and sizes from viewport units instead. Fullscreen uses the browser Fullscreen API on `documentElement`; `onFullscreenChange()` mirrors the real state onto an `html.is-fullscreen` class, which hides the header and hint. The button is hidden where the API is unavailable (iOS Safari).

### Testing approach

`run-tests.js` uses only Node.js built-ins. It loads the browser classes via the `Function` constructor with a minimal DOM shim (stub elements, no jsdom). Source paths are resolved with `__dirname`. Pure-logic methods (`syntaxHighlight`, `formatBytes`, `findAllMatches`, `escapeHtml`, `getLineAndColumn`, `isValidJSON`, `slideRow`, `computeMove`, …) are tested by calling them on instantiated objects. DOM-mutating methods (`formatJSON`, `minifyJSON`, `move`, `undo`) are tested by inspecting stub element state after the call.

The `makeGame(opts)` factory injects a deterministic `rng` (default: always `0`, so new tiles fill the first empty cell with a `2`), an in-memory `localStorage` (`opts.store` pre-seeds it), and synchronous `setTimeout` / `requestAnimationFrame` stubs so `render()` completes inside the call. Use fresh arrays for any grid you pass to a mutating method (`addRandomTile`, `game.grid = …`) — the suite's `Z()` helper exists for that reason.

### Key behaviours to preserve

- `escapeHtml` works by setting `div.textContent` and reading `div.innerHTML` — it requires a DOM `createElement` shim to function correctly in tests.
- `copyToClipboard` and `downloadJSON` both re-serialize from `this.currentData` (not from the DOM), so they always produce clean JSON regardless of the current render mode.
- The `localStorage` key `testJSON` is checked on load in `index.html` to pre-populate the input — used for manual testing workflows.
- `.json` files are gitignored — test data must be generated locally with `generate-test-data.js`.
- Each `*.js` page script must end with its `document.addEventListener('DOMContentLoaded', …)` block — `loadSrc()` in the test runner strips exactly that trailing statement before evaluating the class.
- `slideDuration` in `game-2048.js` must match the `.tile` `transition` duration in `game-2048.css`.
