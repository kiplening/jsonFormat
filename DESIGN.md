# JSON Formatter - Design Document

## Performance Optimization for Large Files (2.8MB+)

### Problem
- Large JSON files (2.8MB) cause page unresponsive/freeze
- DOM rendering blocks UI thread
- Memory issues with deep nested structures

### Solution Design

#### 1. Lazy Rendering Strategy
- **Initial State**: Everything collapsed by default
- **On Expand**: Render children on-demand (lazy loading)
- **Storage**: Use WeakMap for data references (no serialization)

#### 2. Collapse Rules
- Root level arrays/objects: Start COLLAPSED if:
  - Arrays: > 50 items
  - Objects: > 20 fields
- Nested levels (indent > 0): ALL start COLLAPSED
- Primitives: Always render immediately

#### 3. Expand Behavior
- **Expand All Button**: Should expand ALL levels recursively
- **Collapse All Button**: Should collapse ALL levels recursively
- **Individual Toggle**: Expand/collapse single node only

#### 4. Data Flow
```
JSON File Upload → Parse → Create Root Container (collapsed)
                                   ↓
                          User clicks Expand (▶)
                                   ↓
                          Render immediate children (all collapsed)
                                   ↓
                          User clicks child Expand
                                   ↓
                          Render grandchildren (all collapsed)
```

#### 5. Key Features to Test

##### File Upload
- [x] Upload button exists
- [ ] Can upload .json files
- [ ] Shows file size after upload
- [ ] Auto-formats large files
- [ ] Loading indicator appears

##### Formatting
- [ ] Format button works
- [ ] Shows collapsed JSON initially (large files)
- [ ] Size indicators show (// X items, // X fields)
- [ ] Can expand individual nodes
- [ ] Can collapse individual nodes
- [ ] Syntax highlighting works

##### Expand/Collapse All
- [ ] Expand All: Opens ALL levels recursively
- [ ] Collapse All: Closes ALL levels recursively
- [ ] Works on partially expanded tree

##### Copy/Download
- [ ] Copy copies pure JSON (not HTML)
- [ ] Download saves pure JSON
- [ ] Respects indent settings (2/4 spaces, tab)

##### Indent Control
- [ ] Can switch between 2 spaces, 4 spaces, tab
- [ ] Re-renders when changed
- [ ] Affects both display and copy/download

##### Layout
- [ ] Output area doesn't expand outside container
- [ ] Scrollable when content overflows
- [ ] Responsive on window resize

##### Error Handling
- [ ] Shows detailed error for invalid JSON
- [ ] Shows line/column of error
- [ ] Shows code snippet with error highlighted

### Implementation Details

#### WeakMap Storage
```javascript
this.dataMap = new WeakMap();
// Store: this.dataMap.set(element, { data, indent, rendered: false })
// Retrieve: const stored = this.dataMap.get(element)
```

#### Expand All Implementation
- Must recursively find ALL collapsed elements
- Trigger expand for each (which renders children)
- Children also start collapsed, so must recurse again

#### Performance Targets
- Initial render: < 500ms for 2.8MB file
- Expand single node: < 100ms
- Expand All: Progressive (with loading indicator)
- No page freeze/unresponsive warnings

## NEW APPROACH - Dual View Mode (v2)

### Problem with Current Approach
- Even lazy rendering is laggy for 2.8MB
- DOM nodes are expensive
- Expand All tries to create thousands of elements

### Solution: Dual View Mode

#### 1. Text Mode (Default for Large Files)
- Show formatted JSON as plain text in `<pre>` tag
- No DOM nodes, just text
- Instant rendering
- Supports search (Ctrl+F browser native)
- Syntax highlighting with CSS

#### 2. Tree Mode (Interactive)
- Collapsible tree view (current implementation)
- Only for smaller files (< 500KB) or user opt-in
- Full interactive features

#### 3. Search Feature
- Works on both modes
- Highlights matches in text
- Jumps to match
- Shows count (X of Y matches)

### View Mode Logic
```
File Size > 500KB:
  → Default: Text Mode
  → Show warning: "Large file detected. Using text mode for performance."
  → Button: "Switch to Tree View" (with warning)

File Size < 500KB:
  → Default: Tree Mode
  → Button: "Switch to Text View"
```

### Search Implementation
```javascript
// Works on raw JSON string
const matches = findAllMatches(jsonString, searchQuery);
// Highlight in UI
// Support: next/previous match navigation
```

### Testing Checklist
1. Test with test-large.json (2.8MB)
2. Test each button/feature individually
3. Test edge cases (empty arrays/objects, deeply nested)
4. Test browser doesn't freeze
5. Test all features work after optimizations
