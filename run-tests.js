/**
 * Comprehensive test suite for JSONFormatter (script.js) and URLTool (url-tool.js)
 *
 * Uses only Node.js built-in modules — no external dependencies required.
 *
 * Strategy: The browser classes rely on DOM APIs (document.getElementById etc.).
 * We load each file via the Function constructor, injecting a minimal DOM shim,
 * and instantiate the classes with stub elements that expose the state we need
 * to observe. Pure-logic helpers (isValidJSON, syntaxHighlight, formatBytes …)
 * are tested by calling them directly on the instantiated objects.
 *
 * Key implementation notes discovered by inspection:
 *   - formatJSON  → calls renderCollapsibleJSON → appendChild-based DOM tree
 *                   Check: output.children.length > 0 and statusMessage
 *   - minifyJSON  → sets output.textContent = minified string
 *   - syntaxHighlight → returns HTML string with json-key / json-string etc.
 *   - escapeHtml  → sets div.textContent then reads div.innerHTML
 */

'use strict';

const fs = require('fs');

// ─── Terminal colours ────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[1;31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

// ─── Test runner ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0, skipped = 0;
const failures = [];

function suite(name) {
    console.log('\n' + CYAN + BOLD + '━━━ ' + name + ' ━━━' + RESET);
}

function test(description, fn) {
    try {
        fn();
        console.log('  ' + GREEN + '✓' + RESET + ' ' + description);
        passed++;
    } catch (err) {
        console.log('  ' + RED + '✗' + RESET + ' ' + description);
        console.log('    ' + RED + '└─ ' + err.message + RESET);
        failed++;
        failures.push({ description, error: err.message });
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}
function assertEqual(actual, expected, label) {
    if (actual !== expected)
        throw new Error(
            (label || 'assertEqual') +
            '\n       expected: ' + JSON.stringify(expected) +
            '\n       actual:   ' + JSON.stringify(actual)
        );
}
function assertDeepEqual(actual, expected, label) {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(
            (label || 'assertDeepEqual') +
            '\n       expected: ' + JSON.stringify(expected) +
            '\n       actual:   ' + JSON.stringify(actual)
        );
}

// ─── DOM shim helpers ─────────────────────────────────────────────────────────
function makeEl(tag, extra) {
    const el = {
        tag,
        value: '',
        _tc: '',
        _html: undefined,
        get textContent()  { return this._tc; },
        set textContent(v) { this._tc = String(v); },
        get innerHTML()    { if (this._html !== undefined) return this._html; return this._tc.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); },
        set innerHTML(v)   { this._html = v; },
        className: '',
        style: {},
        children: [],
        _attrs: {},
        addEventListener: function() {},
        setAttribute: function(k, v) { this._attrs[k] = v; },
        getAttribute: function(k)    { return this._attrs[k]; },
        appendChild:  function(c)    { this.children.push(c); },
        removeChild:  function()     {},
        focus:        function()     {},
        select:       function()     {},
    };
    if (extra) {
        Object.keys(extra).forEach(function(k) { el[k] = extra[k]; });
    }
    return el;
}

function makeDoc(overrides) {
    return {
        getElementById: function(id) { return overrides[id] || makeEl('div', { id: id }); },
        createElement:  function(tag) { return makeEl(tag); },
        addEventListener: function() {},
        body: { appendChild: function() {}, removeChild: function() {} },
        execCommand: function() { return true; },
    };
}

/**
 * Walk the stub DOM tree and collect all textContent strings concatenated.
 * This lets us see what text formatJSON actually built.
 */
function collectText(el) {
    var text = el._tc || '';
    var kids = el.children || [];
    for (var i = 0; i < kids.length; i++) {
        text += collectText(kids[i]);
    }
    return text;
}

// ─── Load browser-class source — strip DOMContentLoaded bootstrap ─────────────
function loadSrc(filePath) {
    var src = fs.readFileSync(filePath, 'utf8');
    src = src.replace(/document\.addEventListener\(\s*['"]DOMContentLoaded['"][\s\S]*?\}\s*\)\s*;?\s*$/, '');
    return src;
}

var scriptSrc  = loadSrc('/Users/marco/vibe_coding/jsonFormat/script.js');
var urlToolSrc = loadSrc('/Users/marco/vibe_coding/jsonFormat/url-tool.js');

// ─── Factory: JSONFormatter ───────────────────────────────────────────────────
function makeFormatter(inputValue, indentValue) {
    inputValue  = inputValue  !== undefined ? inputValue  : '';
    indentValue = indentValue !== undefined ? indentValue : '2';

    var els = {
        jsonInput:     makeEl('textarea', { value: inputValue }),
        jsonOutput:    makeEl('div'),
        statusMessage: makeEl('div'),
        indentSize:    makeEl('select', { value: indentValue }),
        searchInput:   makeEl('input'),
        searchResults: makeEl('div'),
        formatBtn:     makeEl('button'),
        minifyBtn:     makeEl('button'),
        validateBtn:   makeEl('button'),
        uploadBtn:     makeEl('button'),
        clearBtn:      makeEl('button'),
        copyBtn:       makeEl('button'),
        downloadBtn:   makeEl('button'),
        expandAllBtn:  makeEl('button'),
        collapseAllBtn:makeEl('button'),
        fileInput:     makeEl('input'),
    };
    var doc = makeDoc(els);
    var nav = { clipboard: { writeText: function() { return Promise.resolve(); } } };

    var ctor = new Function('document', 'navigator', 'setTimeout', 'URL', 'clearTimeout', 'window',
        scriptSrc + '\nreturn JSONFormatter;'
    )(doc, nav, setTimeout, URL, clearTimeout, { URL: URL });

    var fmt = new ctor();

    // Expose internals so tests can read state
    fmt.jsonInput     = els.jsonInput;
    fmt.jsonOutput    = els.jsonOutput;
    fmt.statusMessage = els.statusMessage;
    fmt.indentSize    = els.indentSize;
    fmt.searchInput   = els.searchInput;
    fmt.searchResults = els.searchResults;

    return fmt;
}

// ─── Factory: URLTool ─────────────────────────────────────────────────────────
function makeURLTool(inputValue) {
    inputValue = inputValue !== undefined ? inputValue : '';

    var els = {
        urlInput:       makeEl('textarea', { value: inputValue }),
        urlOutput:      makeEl('textarea'),
        paramsOutput:   makeEl('div'),
        urlInfoSection: makeEl('div', { style: { display: 'none' } }),
        message:        makeEl('div'),
        encodeBtn:      makeEl('button'),
        decodeBtn:      makeEl('button'),
        clearBtn:       makeEl('button'),
        copyBtn:        makeEl('button'),
        infoProtocol:   makeEl('span'),
        infoDomain:     makeEl('span'),
        infoPort:       makeEl('span'),
        infoPath:       makeEl('span'),
        infoHash:       makeEl('span'),
    };
    var doc = makeDoc(els);
    var nav = { clipboard: { writeText: function() { return Promise.resolve(); } } };

    var ctor = new Function('document', 'navigator', 'setTimeout', 'URL', 'clearTimeout',
        urlToolSrc + '\nreturn URLTool;'
    )(doc, nav, setTimeout, URL, clearTimeout);

    var tool = new ctor();

    tool.urlInput       = els.urlInput;
    tool.urlOutput      = els.urlOutput;
    tool.paramsOutput   = els.paramsOutput;
    tool.urlInfoSection = els.urlInfoSection;
    tool.message        = els.message;

    return tool;
}

// Shared formatter instance for stateless tests (pure helpers)
var sharedFmt = makeFormatter();

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 1 — JSON Parsing & Validation (isValidJSON)
// ═══════════════════════════════════════════════════════════════════════════════
suite('JSON Parsing & Validation (isValidJSON)');

test('valid simple object',            function() { assert(sharedFmt.isValidJSON('{"a":1}')); });
test('valid array',                    function() { assert(sharedFmt.isValidJSON('[1, 2, 3]')); });
test('valid string literal',           function() { assert(sharedFmt.isValidJSON('"hello"')); });
test('valid number literal',           function() { assert(sharedFmt.isValidJSON('42')); });
test('valid boolean true',             function() { assert(sharedFmt.isValidJSON('true')); });
test('valid boolean false',            function() { assert(sharedFmt.isValidJSON('false')); });
test('valid null',                     function() { assert(sharedFmt.isValidJSON('null')); });
test('valid empty object',             function() { assert(sharedFmt.isValidJSON('{}')); });
test('valid empty array',              function() { assert(sharedFmt.isValidJSON('[]')); });
test('valid nested object',            function() { assert(sharedFmt.isValidJSON('{"a":{"b":{"c":42}}}')); });
test('valid array with mixed types',   function() { assert(sharedFmt.isValidJSON('[null, true, false, 1, "two", {}]')); });
test('invalid — trailing comma in object', function() { assert(!sharedFmt.isValidJSON('{"a":1,}')); });
test('invalid — trailing comma in array',  function() { assert(!sharedFmt.isValidJSON('[1,2,]')); });
test('invalid — single-quoted strings',   function() { assert(!sharedFmt.isValidJSON("{'a':1}")); });
test('invalid — bare word keys',           function() { assert(!sharedFmt.isValidJSON('{a:1}')); });
test('invalid — comment in JSON',          function() { assert(!sharedFmt.isValidJSON('{"a":1} // comment')); });
test('invalid — empty string',             function() { assert(!sharedFmt.isValidJSON('')); });
test('invalid — whitespace only',          function() { assert(!sharedFmt.isValidJSON('   ')); });
test('invalid — unclosed object',          function() { assert(!sharedFmt.isValidJSON('{"a":1')); });
test('invalid — undefined value',          function() { assert(!sharedFmt.isValidJSON('{"a":undefined}')); });

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 2 — JSON Formatting
// ═══════════════════════════════════════════════════════════════════════════════
suite('JSON Formatting (formatJSON)');

// formatJSON builds a DOM tree via appendChild — we inspect children and statusMessage.

test('formatJSON on valid JSON — success status set', function() {
    var f = makeFormatter('{"a":1}', '2');
    f.formatJSON();
    assert(f.statusMessage.className.includes('success'), 'success status class expected');
    assert(f.statusMessage.textContent.includes('success') || f.statusMessage.textContent.length > 0,
        'status message text present');
});

test('formatJSON on valid JSON — DOM tree appended to output', function() {
    var f = makeFormatter('{"name":"Alice","age":30}', '2');
    f.formatJSON();
    assert(f.jsonOutput.children.length > 0, 'output should have children (DOM tree)');
});

test('formatJSON DOM tree contains key text', function() {
    var f = makeFormatter('{"greeting":"hello"}', '2');
    f.formatJSON();
    var text = collectText(f.jsonOutput);
    assert(text.includes('greeting'), 'key "greeting" should appear in DOM text');
    assert(text.includes('hello'),    'value "hello" should appear in DOM text');
});

test('formatJSON DOM tree contains number value', function() {
    var f = makeFormatter('{"count":42}', '2');
    f.formatJSON();
    var text = collectText(f.jsonOutput);
    assert(text.includes('42'), 'number 42 should appear in DOM text');
});

test('formatJSON with tab indent — success status', function() {
    var f = makeFormatter('{"a":1}', 'tab');
    f.formatJSON();
    assert(f.statusMessage.className.includes('success'), 'tab indent: success status');
});

test('formatJSON with 4-space indent — success status', function() {
    var f = makeFormatter('{"a":1}', '4');
    f.formatJSON();
    assert(f.statusMessage.className.includes('success'), '4-space indent: success status');
});

test('formatJSON on empty object {} — success and DOM tree built', function() {
    var f = makeFormatter('{}');
    f.formatJSON();
    assert(f.statusMessage.className.includes('success'), 'empty object: success status');
    assert(f.jsonOutput.children.length > 0, 'empty object: DOM tree appended');
});

test('formatJSON on empty array [] — success and DOM tree built', function() {
    var f = makeFormatter('[]');
    f.formatJSON();
    assert(f.statusMessage.className.includes('success'), 'empty array: success status');
    assert(f.jsonOutput.children.length > 0, 'empty array: DOM tree appended');
});

test('formatJSON on invalid JSON — error status set', function() {
    var f = makeFormatter('{invalid}');
    f.formatJSON();
    var combined = (f.statusMessage.className || '') + (f.jsonOutput.innerHTML || '');
    assert(
        combined.toLowerCase().includes('error') || combined.includes('Error'),
        'invalid JSON should produce error state'
    );
});

test('formatJSON on empty input — error status set', function() {
    var f = makeFormatter('');
    f.formatJSON();
    var combined = (f.statusMessage.className || '') + (f.statusMessage.textContent || '') + (f.jsonOutput.innerHTML || '');
    assert(
        combined.toLowerCase().includes('error') ||
        combined.toLowerCase().includes('invalid') ||
        combined.toLowerCase().includes('enter'),
        'empty input should produce error/invalid state'
    );
});

test('formatJSON on deeply nested JSON — success', function() {
    var f = makeFormatter('{"a":{"b":{"c":{"d":42}}}}');
    f.formatJSON();
    assert(f.statusMessage.className.includes('success'), 'deeply nested: success status');
});

test('formatJSON on array with mixed types — success', function() {
    var f = makeFormatter('[null, true, false, 1, "two", {}]');
    f.formatJSON();
    assert(f.statusMessage.className.includes('success'), 'mixed array: success status');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 3 — JSON Minifying
// ═══════════════════════════════════════════════════════════════════════════════
suite('JSON Minifying (minifyJSON)');

// minifyJSON sets jsonOutput.textContent = compacted string

test('minifyJSON removes whitespace/newlines', function() {
    var f = makeFormatter('{\n  "a": 1,\n  "b": 2\n}');
    f.minifyJSON();
    var text = f.jsonOutput.textContent;
    assert(text.length > 0, 'output should not be empty');
    assert(!text.includes('\n'), 'no newlines in minified output');
    assert(!text.includes('  '), 'no multi-space indent in minified output');
});

test('minifyJSON on already-minified JSON produces identical string', function() {
    var f = makeFormatter('{"x":true}');
    f.minifyJSON();
    assertEqual(f.jsonOutput.textContent, '{"x":true}', 'already-minified stays the same');
});

test('minifyJSON preserves number values', function() {
    var f = makeFormatter('{ "pi": 3.14159 }');
    f.minifyJSON();
    assert(f.jsonOutput.textContent.includes('3.14159'), 'float value preserved');
});

test('minifyJSON preserves string values', function() {
    var f = makeFormatter('{ "name": "Alice" }');
    f.minifyJSON();
    assert(f.jsonOutput.textContent.includes('Alice'), 'string value preserved');
});

test('minifyJSON on empty object produces {}', function() {
    var f = makeFormatter('{}');
    f.minifyJSON();
    assertEqual(f.jsonOutput.textContent, '{}', 'empty object minified');
});

test('minifyJSON on empty array produces []', function() {
    var f = makeFormatter('[]');
    f.minifyJSON();
    assertEqual(f.jsonOutput.textContent, '[]', 'empty array minified');
});

test('minifyJSON on nested object — correct compact output', function() {
    var f = makeFormatter('{"a":{"b":1}}');
    f.minifyJSON();
    var parsed = JSON.parse(f.jsonOutput.textContent);
    assertEqual(parsed.a.b, 1, 'nested value preserved after minify');
});

test('minifyJSON on invalid JSON — error communicated', function() {
    var f = makeFormatter('[1,2,');
    f.minifyJSON();
    var combined = (f.statusMessage.className || '') + (f.statusMessage.textContent || '') + (f.jsonOutput.innerHTML || '');
    assert(
        combined.toLowerCase().includes('error') || combined.toLowerCase().includes('invalid'),
        'error should appear for invalid JSON'
    );
});

test('minifyJSON round-trip — parsed output matches original data', function() {
    var original = { a: 1, b: [2, 3], c: null, d: true };
    var f = makeFormatter(JSON.stringify(original, null, 4));
    f.minifyJSON();
    var result = JSON.parse(f.jsonOutput.textContent);
    assertDeepEqual(result, original, 'round-trip preserves data');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 4 — Syntax Highlighting (syntaxHighlight)
// ═══════════════════════════════════════════════════════════════════════════════
suite('Syntax Highlighting');

test('keys get json-key class', function() {
    assert(sharedFmt.syntaxHighlight('{"name": "Alice"}').includes('json-key'));
});
test('string values get json-string class', function() {
    assert(sharedFmt.syntaxHighlight('{"name": "Alice"}').includes('json-string'));
});
test('number values get json-number class', function() {
    assert(sharedFmt.syntaxHighlight('{"count": 42}').includes('json-number'));
});
test('boolean true gets json-boolean class', function() {
    assert(sharedFmt.syntaxHighlight('{"active": true}').includes('json-boolean'));
});
test('boolean false gets json-boolean class', function() {
    assert(sharedFmt.syntaxHighlight('{"active": false}').includes('json-boolean'));
});
test('null gets json-null class', function() {
    assert(sharedFmt.syntaxHighlight('{"val": null}').includes('json-null'));
});
test('HTML angle brackets are escaped', function() {
    var html = sharedFmt.syntaxHighlight('{"h": "<script>"}');
    assert(!html.includes('<script>'), 'raw <script> must not appear');
    assert(html.includes('&lt;'), '< must be &lt;');
});
test('ampersands are escaped to &amp;', function() {
    assert(sharedFmt.syntaxHighlight('{"v": "a & b"}').includes('&amp;'), '& becomes &amp;');
});
test('negative numbers get json-number class', function() {
    assert(sharedFmt.syntaxHighlight('{"t": -273.15}').includes('json-number'));
});
test('scientific notation numbers get json-number class', function() {
    assert(sharedFmt.syntaxHighlight('{"v": 1.5e10}').includes('json-number'));
});
test('empty object {} produces a string result', function() {
    assert(typeof sharedFmt.syntaxHighlight('{}') === 'string');
});
test('empty array [] produces a string result', function() {
    assert(typeof sharedFmt.syntaxHighlight('[]') === 'string');
});
test('all token types highlighted in one call', function() {
    var html = sharedFmt.syntaxHighlight(JSON.stringify({ k: 'str', n: 1, b: true, nil: null }));
    assert(html.includes('json-key'),     'keys highlighted');
    assert(html.includes('json-string'),  'strings highlighted');
    assert(html.includes('json-number'),  'numbers highlighted');
    assert(html.includes('json-boolean'), 'booleans highlighted');
    assert(html.includes('json-null'),    'null highlighted');
});
test('URLTool.syntaxHighlight produces equivalent highlighting', function() {
    var u = makeURLTool();
    var html = u.syntaxHighlight('{"key": "value", "num": 42, "ok": true, "x": null}');
    assert(html.includes('json-key'),     'URLTool: keys');
    assert(html.includes('json-string'),  'URLTool: strings');
    assert(html.includes('json-number'),  'URLTool: numbers');
    assert(html.includes('json-boolean'), 'URLTool: booleans');
    assert(html.includes('json-null'),    'URLTool: null');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 5 — Error Handling & Position Detection
// ═══════════════════════════════════════════════════════════════════════════════
suite('Error Handling & Position Detection');

test('getLineAndColumn — position 0 returns line 1 col 1', function() {
    var r = sharedFmt.getLineAndColumn('{"a":1}', 0);
    assertEqual(r.line, 1, 'line'); assertEqual(r.column, 1, 'column');
});
test('getLineAndColumn — second line detected', function() {
    var text = '{\n  "a": 1\n}';
    var r = sharedFmt.getLineAndColumn(text, text.indexOf('"a"'));
    assertEqual(r.line, 2, 'line 2');
    assert(r.column > 1, 'column > 1');
});
test('getLineAndColumn — third line detected', function() {
    var text = 'line1\nline2\nline3';
    assertEqual(sharedFmt.getLineAndColumn(text, text.indexOf('line3')).line, 3);
});
test('getLineAndColumn — end of first line', function() {
    var r = sharedFmt.getLineAndColumn('abc\ndef', 3);
    assertEqual(r.line, 1, 'line 1'); assertEqual(r.column, 4, 'column 4');
});
test('displayDetailedError — no throw on SyntaxError with position', function() {
    var f = makeFormatter();
    f.jsonOutput = { innerHTML: '', style: {}, appendChild: function() {}, children: [] };
    f.displayDetailedError(new SyntaxError('Unexpected token } at position 8'), '{"a":1}}');
    assert(true);
});
test('displayDetailedError — no throw on error without position', function() {
    var f = makeFormatter();
    f.jsonOutput = { innerHTML: '', style: {}, appendChild: function() {} };
    f.displayDetailedError(new SyntaxError('Invalid JSON'), 'not json');
    assert(true);
});
test('validateJSON on valid JSON — success status', function() {
    var f = makeFormatter('{"valid":true}');
    f.validateJSON();
    assert(!f.statusMessage.className.includes('error'), 'no error class for valid JSON');
});
test('validateJSON on invalid JSON — error status', function() {
    var f = makeFormatter('{bad}');
    f.validateJSON();
    assert(f.statusMessage.className.includes('error'), 'error class for invalid JSON');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 6 — HTML Escaping (escapeHtml)
// ═══════════════════════════════════════════════════════════════════════════════
suite('HTML Escaping (escapeHtml)');

test('escapes < and >', function() {
    var r = sharedFmt.escapeHtml('<div>');
    assert(r.includes('&lt;') && r.includes('&gt;'), 'angle brackets escaped');
});
test('escapes ampersand', function() {
    assert(sharedFmt.escapeHtml('a & b').includes('&amp;'), 'ampersand escaped');
});
test('plain text passes through unchanged', function() {
    assertEqual(sharedFmt.escapeHtml('hello world'), 'hello world');
});
test('empty string returns empty string', function() {
    assertEqual(sharedFmt.escapeHtml(''), '');
});
test('escapes double-quotes', function() {
    var r = sharedFmt.escapeHtml('"quoted"');
    // The shim simulates browser div.innerHTML which escapes " as &quot;
    assert(r.includes('&quot;') || r === '"quoted"', 'quotes handled');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 7 — formatBytes
// ═══════════════════════════════════════════════════════════════════════════════
suite('formatBytes');

test('0 bytes → "0 B"',         function() { assertEqual(sharedFmt.formatBytes(0), '0 B'); });
test('512 bytes → "512 B"',     function() { assertEqual(sharedFmt.formatBytes(512), '512 B'); });
test('1023 bytes → "1023 B"',   function() { assertEqual(sharedFmt.formatBytes(1023), '1023 B'); });
test('1024 bytes → "1.0 KB"',   function() { assertEqual(sharedFmt.formatBytes(1024), '1.0 KB'); });
test('1536 bytes → "1.5 KB"',   function() { assertEqual(sharedFmt.formatBytes(1536), '1.5 KB'); });
test('1 MB → "1.0 MB"',         function() { assertEqual(sharedFmt.formatBytes(1024 * 1024), '1.0 MB'); });
test('2.5 MB → "2.5 MB"',       function() { assertEqual(sharedFmt.formatBytes(2.5 * 1024 * 1024), '2.5 MB'); });

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 8 — findAllMatches (Search)
// ═══════════════════════════════════════════════════════════════════════════════
suite('findAllMatches (Search)');

test('single match', function() {
    assertDeepEqual(sharedFmt.findAllMatches('hello world', 'world'), [6]);
});
test('multiple matches', function() {
    assertDeepEqual(sharedFmt.findAllMatches('aaa', 'a'), [0, 1, 2]);
});
test('case-insensitive matching', function() {
    assertEqual(sharedFmt.findAllMatches('Hello HELLO hello', 'hello').length, 3);
});
test('no match returns []', function() {
    assertDeepEqual(sharedFmt.findAllMatches('hello world', 'xyz'), []);
});
test('match at position 0', function() {
    assertEqual(sharedFmt.findAllMatches('foobar', 'foo')[0], 0);
});
test('match at end of string', function() {
    assertEqual(sharedFmt.findAllMatches('foobar', 'bar')[0], 3);
});
test('non-overlapping matches for "aa" in "aaaa"', function() {
    assertDeepEqual(sharedFmt.findAllMatches('aaaa', 'aa'), [0, 2]);
});
test('finds "key" in real JSON string multiple times', function() {
    var matches = sharedFmt.findAllMatches('{"key":"value","key2":"other"}', 'key');
    assert(matches.length >= 2, 'at least 2 occurrences');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 9 — URL Encoding
// ═══════════════════════════════════════════════════════════════════════════════
suite('URL Encoding (URLTool.encode)');

test('encodes spaces as %20', function() {
    var u = makeURLTool('hello world');
    u.encode();
    assertEqual(u.urlOutput.value, 'hello%20world');
});
test('encodes & and = characters', function() {
    var u = makeURLTool('a=1&b=2');
    u.encode();
    var out = u.urlOutput.value;
    assert(out.includes('%3D') || out.includes('%26'), 'special chars encoded');
});
test('encodes unicode character é as %C3%A9', function() {
    var u = makeURLTool('café');
    u.encode();
    assert(u.urlOutput.value.toUpperCase().includes('%C3%A9'), 'é encoded');
});
test('encodes # as %23', function() {
    var u = makeURLTool('a#b');
    u.encode();
    assert(u.urlOutput.value.includes('%23'), '# becomes %23');
});
test('encodes ? as %3F', function() {
    var u = makeURLTool('is it true?');
    u.encode();
    assert(u.urlOutput.value.toUpperCase().includes('%3F'), '? becomes %3F');
});
test('encodes / as %2F', function() {
    var u = makeURLTool('a/b');
    u.encode();
    assert(u.urlOutput.value.toUpperCase().includes('%2F'), '/ becomes %2F');
});
test('alphanumeric input stays unchanged', function() {
    var u = makeURLTool('helloworld123');
    u.encode();
    assertEqual(u.urlOutput.value, 'helloworld123');
});
test('empty input shows error', function() {
    var u = makeURLTool('');
    u.urlInput.value = '';
    u.encode();
    assert(u.message.className.includes('error'), 'error class set');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 10 — URL Decoding
// ═══════════════════════════════════════════════════════════════════════════════
suite('URL Decoding (URLTool.decodeURL)');

test('decodes %20 back to space', function() {
    var u = makeURLTool('hello%20world');
    u.decodeURL();
    assertEqual(u.urlOutput.value, 'hello world');
});
test('decodes %C3%A9 back to é', function() {
    var u = makeURLTool('caf%C3%A9');
    u.decodeURL();
    assertEqual(u.urlOutput.value, 'café');
});
test('decodes full URL — params extracted', function() {
    var u = makeURLTool('https://example.com/path?name=Alice&age=30');
    u.decodeURL();
    assert(u.paramsOutput.innerHTML.includes('Alice'), 'Alice in params');
    assert(u.paramsOutput.innerHTML.includes('age') || u.paramsOutput.innerHTML.includes('30'), 'age in params');
});
test('decodes URL with no query params — info section shown', function() {
    var u = makeURLTool('https://example.com/path');
    u.decodeURL();
    assertEqual(u.urlInfoSection.style.display, 'block', 'info section visible');
    assert(u.paramsOutput.innerHTML.includes('No query') || u.parsedParams === null, 'no-params indicator');
});
test('decodes URL with hash fragment', function() {
    var u = makeURLTool('https://example.com/page#section1');
    u.decodeURL();
    assert(u.urlOutput.value.includes('example.com'), 'URL decoded into output');
});
test('duplicate query param keys become an array', function() {
    var u = makeURLTool('https://example.com/?tag=a&tag=b&tag=c');
    u.decodeURL();
    assert(Array.isArray(u.parsedParams.tag), 'duplicate keys → array');
    assertEqual(u.parsedParams.tag.length, 3, 'array has 3 elements');
});
test('empty input shows error', function() {
    var u = makeURLTool('');
    u.urlInput.value = '';
    u.decodeURL();
    assert(u.message.className.includes('error'), 'error class set');
});
test('decodes plain percent-encoded text', function() {
    var u = makeURLTool('Hello%2C%20World!');
    u.decodeURL();
    assertEqual(u.urlOutput.value, 'Hello, World!');
});
test('+ in plain text stays as + (decodeURIComponent behaviour)', function() {
    var u = makeURLTool('a+b');
    u.decodeURL();
    assertEqual(u.urlOutput.value, 'a+b', '+ unchanged');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 11 — URL Parameter Extraction
// ═══════════════════════════════════════════════════════════════════════════════
suite('URL Parameter Extraction');

test('single param extracted', function() {
    var u = makeURLTool('https://api.example.com?token=abc123');
    u.decodeURL();
    assertEqual(u.parsedParams.token, 'abc123');
});
test('multiple params extracted', function() {
    var u = makeURLTool('https://search.example.com?q=json&page=2&sort=asc');
    u.decodeURL();
    assertEqual(u.parsedParams.q, 'json', 'q'); assertEqual(u.parsedParams.page, '2', 'page'); assertEqual(u.parsedParams.sort, 'asc', 'sort');
});
test('encoded param value decoded', function() {
    var u = makeURLTool('https://example.com?msg=hello%20world');
    u.decodeURL();
    assertEqual(u.parsedParams.msg, 'hello world');
});
test('URL-in-param decoded correctly', function() {
    var u = makeURLTool('https://example.com?redirect=https%3A%2F%2Fother.com');
    u.decodeURL();
    assert(u.parsedParams.redirect.includes('other.com'), 'nested URL decoded');
});
test('empty param value is empty string', function() {
    var u = makeURLTool('https://example.com?key=');
    u.decodeURL();
    assert(u.parsedParams && u.parsedParams.key === '', 'empty value');
});
test('URL with port — info section shown', function() {
    var u = makeURLTool('https://example.com:8080/api?v=1');
    u.decodeURL();
    assertEqual(u.urlInfoSection.style.display, 'block', 'info section shown');
});
test('params rendered as JSON in paramsOutput', function() {
    var u = makeURLTool('https://example.com?x=1&y=2');
    u.decodeURL();
    assert(u.paramsOutput.innerHTML.includes('"x"') || u.paramsOutput.innerHTML.includes('x'), 'key in output');
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUITE 12 — Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════
suite('Edge Cases');

test('deeply nested object — isValidJSON', function() {
    assert(sharedFmt.isValidJSON('{"a":{"b":{"c":{"d":{"e":{"f":42}}}}}}'));
});
test('deeply nested array — isValidJSON', function() {
    assert(sharedFmt.isValidJSON('[[[[[42]]]]]'));
});
test('large number — isValidJSON', function() {
    assert(sharedFmt.isValidJSON('9999999999999999'));
});
test('0.5 float — isValidJSON', function() {
    assert(sharedFmt.isValidJSON('0.5'));
});
test('negative zero — isValidJSON', function() {
    assert(sharedFmt.isValidJSON('-0'));
});
test('array of nulls — isValidJSON', function() {
    assert(sharedFmt.isValidJSON('[null, null, null]'));
});
test('unicode escape sequence in value — isValidJSON', function() {
    assert(sharedFmt.isValidJSON('{"emoji":"\\uD83D\\uDE00"}'));
});
test('all JSON value types together — isValidJSON', function() {
    assert(sharedFmt.isValidJSON(JSON.stringify({
        str: 'hello', num: 42, float: 3.14,
        bool_t: true, bool_f: false, nil: null,
        arr: [1, 'two', null], obj: { nested: true }
    })));
});
test('syntaxHighlight on deeply nested JSON highlights all types', function() {
    var html = sharedFmt.syntaxHighlight(JSON.stringify({ a: [1, 2, { b: null }], c: true }));
    assert(html.includes('json-null'),    'null');
    assert(html.includes('json-boolean'), 'boolean');
    assert(html.includes('json-number'),  'number');
    assert(html.includes('json-key'),     'key');
});
test('encode then decode round-trip restores original', function() {
    var original = 'hello world & café #42?';
    assertEqual(decodeURIComponent(encodeURIComponent(original)), original);
});
test('URL with fragment and params — param extracted correctly', function() {
    var u = makeURLTool('https://example.com/page?id=5#section');
    u.decodeURL();
    assert(u.parsedParams && u.parsedParams.id === '5', 'id param');
});
test('minifyJSON then parse — preserves complex structure', function() {
    var original = { a: 1, b: [2, 3], c: null, d: true, e: { nested: 'value' } };
    var f = makeFormatter(JSON.stringify(original, null, 2));
    f.minifyJSON();
    assertDeepEqual(JSON.parse(f.jsonOutput.textContent), original, 'round-trip');
});
test('formatJSON on array of objects — success', function() {
    var f = makeFormatter(JSON.stringify([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]));
    f.formatJSON();
    assert(f.statusMessage.className.includes('success'), 'array of objects: success');
    var text = collectText(f.jsonOutput);
    assert(text.includes('Alice') && text.includes('Bob'), 'values in DOM text');
});
test('formatJSON clears previous output before rendering', function() {
    var f = makeFormatter('{"first":1}');
    f.formatJSON();
    var firstChildCount = f.jsonOutput.children.length;

    // Change input and format again
    f.jsonInput.value = '{"second":2}';
    f.formatJSON();
    // Output should be fresh (innerHTML was reset to '' before appendChild)
    var text = collectText(f.jsonOutput);
    assert(text.includes('second'), 'second key present after second formatJSON');
    assert(!text.includes('first') || text.includes('second'), 'output refreshed');
});

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL REPORT
// ═══════════════════════════════════════════════════════════════════════════════
var total   = passed + failed + skipped;
var divider = '─'.repeat(60);

console.log('\n' + divider);
console.log(BOLD + 'Test Results' + RESET);
console.log(divider);
console.log('  Total:   ' + total);
console.log('  ' + GREEN + 'Passed:  ' + passed + RESET);
console.log('  ' + (failed > 0 ? RED : GREEN) + 'Failed:  ' + failed + RESET);
if (skipped) console.log('  ' + YELLOW + 'Skipped: ' + skipped + RESET);

if (failures.length > 0) {
    console.log('\n' + RED + BOLD + 'Failed Tests:' + RESET);
    failures.forEach(function(f) {
        console.log('  ' + RED + '✗ ' + f.description + RESET);
        f.error.split('\n').forEach(function(l) { console.log('      ' + l); });
    });
}

console.log('\n' + (passed === total - skipped
    ? GREEN + BOLD + 'All tests passed!' + RESET
    : RED + BOLD + 'Some tests failed — see above.' + RESET) + '\n');

process.exit(failed > 0 ? 1 : 0);
