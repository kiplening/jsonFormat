/**
 * 2048 — a small, dependency-free implementation of the sliding-tile game.
 *
 * Pure game logic (slideRow, computeMove, canMove, hasWon, …) operates on a
 * plain 2-D array of numbers (0 = empty) so it can be unit-tested without a
 * DOM. Rendering and animation live in render()/renderGrid() and are driven
 * by the per-tile "moves" list that computeMove returns.
 */
class Game2048 {
    constructor(options) {
        options = options || {};
        this.size   = options.size   || 4;
        this.target = options.target || 2048;
        this.rng    = options.rng    || Math.random;

        this.slideDuration = 100; // ms — keep in sync with the .tile transition in CSS
        this.maxHistory    = 20;
        this.storageKeys   = { best: 'game2048Best', state: 'game2048State' };

        this.boardEl      = document.getElementById('board');
        this.cellsEl      = document.getElementById('cells');
        this.tilesEl      = document.getElementById('tiles');
        this.scoreEl      = document.getElementById('score');
        this.scoreStatEl  = document.getElementById('scoreStat');
        this.bestEl       = document.getElementById('best');
        this.overlayEl    = document.getElementById('overlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayText  = document.getElementById('overlayText');
        this.keepGoingBtn = document.getElementById('keepGoingBtn');
        this.tryAgainBtn  = document.getElementById('tryAgainBtn');
        this.newGameBtn   = document.getElementById('newGameBtn');
        this.undoBtn      = document.getElementById('undoBtn');
        this.message      = document.getElementById('message');

        this.grid        = this.emptyGrid();
        this.score       = 0;
        this.best        = this.loadBest();
        this.over        = false;
        this.won         = false;
        this.keepPlaying = false;
        this.history     = [];

        this.animating     = false;
        this.animTimer     = null;
        this.pendingFinish = null;
        this.pointerStart  = null;

        this.buildCells();
        this.initEventListeners();

        if (!this.restoreState()) {
            this.newGame();
        }
    }

    // ── Event wiring ─────────────────────────────────────────────────────────

    initEventListeners() {
        var self = this;

        if (this.newGameBtn)   this.newGameBtn.addEventListener('click',   function () { self.newGame(); });
        if (this.undoBtn)      this.undoBtn.addEventListener('click',      function () { self.undo(); });
        if (this.tryAgainBtn)  this.tryAgainBtn.addEventListener('click',  function () { self.newGame(); });
        if (this.keepGoingBtn) this.keepGoingBtn.addEventListener('click', function () { self.keepGoing(); });

        document.addEventListener('keydown', function (e) { self.handleKey(e); });

        if (this.boardEl) {
            this.boardEl.addEventListener('pointerdown',   function (e) { self.onPointerDown(e); });
            this.boardEl.addEventListener('pointerup',     function (e) { self.onPointerUp(e); });
            this.boardEl.addEventListener('pointercancel', function ()  { self.pointerStart = null; });
        }
    }

    keyToDirection(key) {
        switch (key) {
            case 'ArrowLeft':  case 'a': case 'h': return 'left';
            case 'ArrowRight': case 'd': case 'l': return 'right';
            case 'ArrowUp':    case 'w': case 'k': return 'up';
            case 'ArrowDown':  case 's': case 'j': return 'down';
            default: return null;
        }
    }

    handleKey(e) {
        var target = e.target;
        if (target && /^(INPUT|TEXTAREA|SELECT)$/i.test(target.tagName || '')) return;

        var key   = e.key || '';
        var lower = key.length === 1 ? key.toLowerCase() : key;

        // Ctrl/Cmd+Z → undo
        if ((e.ctrlKey || e.metaKey) && lower === 'z') {
            if (e.preventDefault) e.preventDefault();
            this.undo();
            return;
        }
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        var dir = this.keyToDirection(lower);
        if (dir) {
            if (e.preventDefault) e.preventDefault();
            this.move(dir);
            return;
        }
        if (lower === 'r') { this.newGame(); return; }
        if (lower === 'u') { this.undo(); }
    }

    onPointerDown(e) {
        this.pointerStart = { x: e.clientX, y: e.clientY };
    }

    onPointerUp(e) {
        if (!this.pointerStart) return;
        var dx = e.clientX - this.pointerStart.x;
        var dy = e.clientY - this.pointerStart.y;
        this.pointerStart = null;
        var dir = this.swipeDirection(dx, dy);
        if (dir) this.move(dir);
    }

    /** Pure: turn a drag vector into a direction, or null if it is too short. */
    swipeDirection(dx, dy, threshold) {
        threshold = threshold || 24;
        var ax = Math.abs(dx), ay = Math.abs(dy);
        if (Math.max(ax, ay) < threshold) return null;
        if (ax > ay) return dx > 0 ? 'right' : 'left';
        return dy > 0 ? 'down' : 'up';
    }

    // ── Grid helpers (pure) ──────────────────────────────────────────────────

    emptyGrid(size) {
        size = size || this.size;
        var grid = [];
        for (var r = 0; r < size; r++) {
            var row = [];
            for (var c = 0; c < size; c++) row.push(0);
            grid.push(row);
        }
        return grid;
    }

    cloneGrid(grid) {
        return grid.map(function (row) { return row.slice(); });
    }

    getEmptyCells(grid) {
        var cells = [];
        for (var r = 0; r < grid.length; r++) {
            for (var c = 0; c < grid[r].length; c++) {
                if (!grid[r][c]) cells.push({ r: r, c: c });
            }
        }
        return cells;
    }

    maxTile(grid) {
        var max = 0;
        for (var r = 0; r < grid.length; r++) {
            for (var c = 0; c < grid[r].length; c++) {
                if (grid[r][c] > max) max = grid[r][c];
            }
        }
        return max;
    }

    hasWon(grid) {
        return this.maxTile(grid) >= this.target;
    }

    /** True if any cell is empty or any two orthogonal neighbours are equal. */
    canMove(grid) {
        var n = grid.length;
        for (var r = 0; r < n; r++) {
            for (var c = 0; c < n; c++) {
                var v = grid[r][c];
                if (!v) return true;
                if (c + 1 < n && grid[r][c + 1] === v) return true;
                if (r + 1 < n && grid[r + 1][c] === v) return true;
            }
        }
        return false;
    }

    /**
     * Pure: slide one line toward index 0 and merge equal neighbours once.
     * Returns { row, score, moved, sources } where sources[i] lists the
     * original indices that ended up in position i (two indices = a merge).
     */
    slideRow(row) {
        var size = row.length;
        var tiles = [];
        for (var i = 0; i < size; i++) {
            if (row[i]) tiles.push({ value: row[i], index: i });
        }

        var out = [], sources = [], score = 0;
        for (i = 0; i < tiles.length; i++) {
            var cur = tiles[i];
            if (i + 1 < tiles.length && tiles[i + 1].value === cur.value) {
                var merged = cur.value * 2;
                out.push(merged);
                sources.push([cur.index, tiles[i + 1].index]);
                score += merged;
                i++; // skip the tile we merged with
            } else {
                out.push(cur.value);
                sources.push([cur.index]);
            }
        }
        while (out.length < size) {
            out.push(0);
            sources.push([]);
        }

        var moved = false;
        for (i = 0; i < size; i++) {
            if (out[i] !== row[i]) { moved = true; break; }
        }
        return { row: out, score: score, moved: moved, sources: sources };
    }

    /**
     * Map (direction, line k, position p along the slide) → grid cell.
     * Position 0 is the edge tiles slide toward.
     */
    cellFor(direction, k, p, size) {
        var n = (size || this.size) - 1;
        switch (direction) {
            case 'left':  return { r: k,     c: p };
            case 'right': return { r: k,     c: n - p };
            case 'up':    return { r: p,     c: k };
            case 'down':  return { r: n - p, c: k };
            default: throw new Error('Unknown direction: ' + direction);
        }
    }

    /**
     * Pure: compute the result of sliding `grid` in `direction`.
     * Returns { grid, score, moved, moves } — `moves` has one entry per tile
     * in the input grid: { from:{r,c}, to:{r,c}, value, merged }.
     */
    computeMove(grid, direction) {
        var size = grid.length;
        var next = this.emptyGrid(size);
        var score = 0, moved = false, moves = [];

        for (var k = 0; k < size; k++) {
            var line = [];
            for (var p = 0; p < size; p++) {
                var cell = this.cellFor(direction, k, p, size);
                line.push(grid[cell.r][cell.c]);
            }

            var res = this.slideRow(line);
            score += res.score;
            if (res.moved) moved = true;

            for (p = 0; p < size; p++) {
                var dest = this.cellFor(direction, k, p, size);
                next[dest.r][dest.c] = res.row[p];
                var srcs = res.sources[p];
                for (var s = 0; s < srcs.length; s++) {
                    moves.push({
                        from:   this.cellFor(direction, k, srcs[s], size),
                        to:     dest,
                        value:  line[srcs[s]],
                        merged: srcs.length > 1
                    });
                }
            }
        }
        return { grid: next, score: score, moved: moved, moves: moves };
    }

    /** Mutates `grid`: spawns a 2 (90%) or 4 (10%) in a random empty cell. */
    addRandomTile(grid) {
        var empty = this.getEmptyCells(grid);
        if (!empty.length) return null;
        var cell  = empty[Math.floor(this.rng() * empty.length)];
        var value = this.rng() < 0.9 ? 2 : 4;
        grid[cell.r][cell.c] = value;
        return { r: cell.r, c: cell.c, value: value };
    }

    // ── Game flow ────────────────────────────────────────────────────────────

    newGame() {
        this.grid        = this.emptyGrid();
        this.score       = 0;
        this.over        = false;
        this.won         = false;
        this.keepPlaying = false;
        this.history     = [];

        this.addRandomTile(this.grid);
        this.addRandomTile(this.grid);

        this.updateUndoButton();
        this.saveState();
        this.render(null);
    }

    /** Apply a move. Returns true if the board changed. */
    move(direction) {
        if (this.over || (this.won && !this.keepPlaying)) return false;

        var result = this.computeMove(this.grid, direction);
        if (!result.moved) return false;

        this.pushHistory();
        this.grid   = result.grid;
        this.score += result.score;
        if (this.score > this.best) {
            this.best = this.score;
            this.saveBest();
        }

        var spawned = this.addRandomTile(this.grid);
        this.updateStatus();
        this.saveState();
        this.render({ moves: result.moves, spawned: spawned, gained: result.score });
        return true;
    }

    updateStatus() {
        if (!this.won && this.hasWon(this.grid)) this.won = true;
        if (!this.canMove(this.grid)) this.over = true;
    }

    keepGoing() {
        this.keepPlaying = true;
        this.saveState();
        this.updateOverlay();
    }

    pushHistory() {
        this.history.push({
            grid:        this.cloneGrid(this.grid),
            score:       this.score,
            won:         this.won,
            keepPlaying: this.keepPlaying
        });
        if (this.history.length > this.maxHistory) this.history.shift();
        this.updateUndoButton();
    }

    undo() {
        var prev = this.history.pop();
        if (!prev) {
            this.showMessage('Nothing to undo', 'error');
            return false;
        }
        this.grid        = prev.grid;
        this.score       = prev.score;
        this.won         = prev.won;
        this.keepPlaying = prev.keepPlaying;
        this.over        = false;

        this.updateUndoButton();
        this.saveState();
        this.render(null);
        return true;
    }

    updateUndoButton() {
        if (this.undoBtn) this.undoBtn.disabled = this.history.length === 0;
    }

    // ── Persistence ──────────────────────────────────────────────────────────

    storageGet(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    storageSet(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
    }

    storageRemove(key) {
        try { localStorage.removeItem(key); } catch (e) { /* storage unavailable */ }
    }

    loadBest() {
        var n = parseInt(this.storageGet(this.storageKeys.best), 10);
        return isNaN(n) || n < 0 ? 0 : n;
    }

    saveBest() {
        this.storageSet(this.storageKeys.best, String(this.best));
    }

    saveState() {
        this.storageSet(this.storageKeys.state, JSON.stringify({
            grid:        this.grid,
            score:       this.score,
            won:         this.won,
            keepPlaying: this.keepPlaying,
            over:        this.over
        }));
    }

    isValidGrid(grid) {
        var self = this;
        return Array.isArray(grid) && grid.length === this.size && grid.every(function (row) {
            return Array.isArray(row) && row.length === self.size && row.every(function (v) {
                return typeof v === 'number' && isFinite(v) && v >= 0;
            });
        });
    }

    /** Resume an in-progress game from localStorage. Returns true on success. */
    restoreState() {
        var raw = this.storageGet(this.storageKeys.state);
        if (!raw) return false;

        var state;
        try { state = JSON.parse(raw); } catch (e) { return false; }
        if (!state || !this.isValidGrid(state.grid) || typeof state.score !== 'number') {
            this.storageRemove(this.storageKeys.state);
            return false;
        }
        if (state.over) return false; // finished game — start fresh

        this.grid        = state.grid;
        this.score       = state.score;
        this.won         = !!state.won;
        this.keepPlaying = !!state.keepPlaying;
        this.over        = false;
        this.history     = [];

        this.updateUndoButton();
        this.render(null);
        return true;
    }

    // ── Rendering ────────────────────────────────────────────────────────────

    buildCells() {
        if (!this.cellsEl) return;
        this.cellsEl.innerHTML = '';
        for (var i = 0; i < this.size * this.size; i++) {
            var cell = document.createElement('div');
            cell.className = 'cell';
            this.cellsEl.appendChild(cell);
        }
    }

    tileClass(value) {
        return value > 2048 ? 'tile-super' : 'tile-' + value;
    }

    positionTile(el, r, c) {
        el.style.setProperty('--x', c);
        el.style.setProperty('--y', r);
    }

    makeTile(value, r, c, extraClass) {
        var el = document.createElement('div');
        el.className = 'tile ' + this.tileClass(value) + (extraClass ? ' ' + extraClass : '');
        el.textContent = String(value);
        this.positionTile(el, r, c);
        return el;
    }

    updateScoreboard() {
        if (this.scoreEl) this.scoreEl.textContent = String(this.score);
        if (this.bestEl)  this.bestEl.textContent  = String(this.best);
    }

    showScoreGain(amount) {
        if (!amount || !this.scoreStatEl) return;
        var el = document.createElement('span');
        el.className = 'score-add';
        el.textContent = '+' + amount;
        this.scoreStatEl.appendChild(el);
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 800);
    }

    /** Draw the current grid with no slide animation. */
    renderGrid(opts) {
        if (!this.tilesEl) return;
        opts = opts || {};
        this.tilesEl.innerHTML = '';
        for (var r = 0; r < this.size; r++) {
            for (var c = 0; c < this.size; c++) {
                var v = this.grid[r][c];
                if (!v) continue;
                var extra = '';
                if (opts.spawned && opts.spawned.r === r && opts.spawned.c === c) extra = 'tile-new';
                else if (opts.merged && opts.merged[r + ',' + c])                 extra = 'tile-merged';
                this.tilesEl.appendChild(this.makeTile(v, r, c, extra));
            }
        }
    }

    /**
     * Render. With `anim` ({ moves, spawned, gained }) tiles are first drawn at
     * their previous positions and then slid to their new ones; the final
     * state (merged + spawned tiles) is drawn when the slide completes.
     */
    render(anim) {
        this.finishAnimation();
        this.updateScoreboard();

        if (!anim || !this.tilesEl) {
            this.renderGrid({});
            this.updateOverlay();
            return;
        }

        this.showScoreGain(anim.gained);

        var self = this;
        var merged = {};
        var pending = [];

        this.tilesEl.innerHTML = '';
        anim.moves.forEach(function (m) {
            if (m.merged) merged[m.to.r + ',' + m.to.c] = true;
            var el = self.makeTile(m.value, m.from.r, m.from.c);
            self.tilesEl.appendChild(el);
            pending.push({ el: el, move: m });
        });

        var raf = typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : function (fn) { fn(); };
        raf(function () {
            void self.tilesEl.offsetWidth; // flush layout so the transition fires
            pending.forEach(function (p) { self.positionTile(p.el, p.move.to.r, p.move.to.c); });
        });

        this.animating = true;
        this.pendingFinish = function () {
            self.renderGrid({ merged: merged, spawned: anim.spawned });
            self.updateOverlay();
        };
        this.animTimer = setTimeout(function () { self.finishAnimation(); }, this.slideDuration + 20);
    }

    /** Complete any in-flight slide immediately so a fast follow-up move is never dropped. */
    finishAnimation() {
        if (!this.animating) return;
        if (this.animTimer) {
            clearTimeout(this.animTimer);
            this.animTimer = null;
        }
        this.animating = false;
        var fn = this.pendingFinish;
        this.pendingFinish = null;
        if (fn) fn();
    }

    updateOverlay() {
        if (!this.overlayEl) return;

        var title = '', text = '', showKeepGoing = false, visible = false;
        if (this.over) {
            visible = true;
            title = 'Game over';
            text  = 'No moves left. Final score: ' + this.score + '.';
        } else if (this.won && !this.keepPlaying) {
            visible = true;
            title = 'You win!';
            text  = 'You made a ' + this.target + ' tile. Keep going for a higher score?';
            showKeepGoing = true;
        }

        if (this.overlayTitle) this.overlayTitle.textContent = title;
        if (this.overlayText)  this.overlayText.textContent  = text;
        if (this.keepGoingBtn) this.keepGoingBtn.style.display = showKeepGoing ? '' : 'none';
        this.overlayEl.className = 'overlay' + (visible ? ' visible' : '');
    }

    // ── Toast ────────────────────────────────────────────────────────────────

    showMessage(text, type) {
        if (!this.message) return;
        var self = this;
        this.message.style.display = '';
        this.message.textContent = text;
        this.message.className = 'message ' + type;
        clearTimeout(this.messageTimer);
        this.messageTimer = setTimeout(function () { self.hideMessage(); }, 2500);
    }

    hideMessage() {
        if (!this.message) return;
        this.message.style.display = 'none';
        this.message.className = 'message';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
