class JSONFormatter {
    constructor() {
        this.jsonInput = document.getElementById('jsonInput');
        this.jsonOutput = document.getElementById('jsonOutput');
        this.statusMessage = document.getElementById('statusMessage');

        this.formatBtn = document.getElementById('formatBtn');
        this.minifyBtn = document.getElementById('minifyBtn');
        this.validateBtn = document.getElementById('validateBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.expandAllBtn = document.getElementById('expandAllBtn');
        this.collapseAllBtn = document.getElementById('collapseAllBtn');
        this.indentSize = document.getElementById('indentSize');
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');
        this.fileInput = document.getElementById('fileInput');

        this.currentData = null;
        this.initEventListeners();
    }

    initEventListeners() {
        this.formatBtn.addEventListener('click', () => this.formatJSON());
        this.minifyBtn.addEventListener('click', () => this.minifyJSON());
        this.validateBtn.addEventListener('click', () => this.validateJSON());
        this.uploadBtn.addEventListener('click', () => this.uploadFile());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.downloadBtn.addEventListener('click', () => this.downloadJSON());
        this.expandAllBtn.addEventListener('click', () => this.expandAll());
        this.collapseAllBtn.addEventListener('click', () => this.collapseAll());
        this.indentSize.addEventListener('change', () => this.onIndentChange());
        this.searchInput.addEventListener('input', () => this.handleSearch());

        this.jsonInput.addEventListener('input', () => this.hideStatus());
        this.jsonInput.addEventListener('paste', () => {
            setTimeout(() => this.autoFormat(), 100);
        });

        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    formatJSON() {
        const input = this.jsonInput.value.trim();

        if (!input) {
            this.showStatus('Please enter some JSON text to format', 'error');
            return;
        }

        try {
            const parsed = JSON.parse(input);
            this.currentData = parsed;

            // Always use collapsible tree view
            this.renderCollapsibleJSON(parsed);
            this.enableCollapseButtons();

            const jsonSize = new Blob([input]).size;
            if (jsonSize > 500 * 1024) {
                this.showStatus(`Large JSON (${this.formatBytes(jsonSize)}) formatted successfully!`, 'success');
            } else {
                this.showStatus('JSON formatted successfully!', 'success');
            }
        } catch (error) {
            this.displayDetailedError(error, input);
        }
    }

    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    renderSimpleJSON(data) {
        const indentSize = this.indentSize.value;
        const indent = indentSize === 'tab' ? '\t' : parseInt(indentSize);
        const formatted = JSON.stringify(data, null, indent);

        // Use lazy rendering for large content
        const lines = formatted.split('\n');

        if (lines.length > 1000) {
            this.renderLazyJSON(lines);
        } else {
            // Add syntax highlighting for smaller files
            this.jsonOutput.innerHTML = '';
            const highlighted = this.syntaxHighlight(formatted);
            this.jsonOutput.innerHTML = highlighted;
        }
    }

    renderLazyJSON(lines) {
        this.jsonOutput.innerHTML = '';
        this.jsonOutput.style.position = 'relative';

        const LINE_HEIGHT = 21; // pixels per line
        const BUFFER = 20; // render extra lines above/below viewport

        // Create container with full height
        const container = document.createElement('div');
        container.style.height = (lines.length * LINE_HEIGHT) + 'px';
        container.style.position = 'relative';

        // Create viewport for visible content
        const viewport = document.createElement('div');
        viewport.style.position = 'absolute';
        viewport.style.top = '0';
        viewport.style.left = '0';
        viewport.style.right = '0';

        container.appendChild(viewport);
        this.jsonOutput.appendChild(container);

        let currentStartLine = 0;
        let currentEndLine = 0;

        const renderVisibleLines = () => {
            const scrollTop = this.jsonOutput.scrollTop;
            const viewportHeight = this.jsonOutput.clientHeight;

            const startLine = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - BUFFER);
            const endLine = Math.min(lines.length, Math.ceil((scrollTop + viewportHeight) / LINE_HEIGHT) + BUFFER);

            // Only re-render if scroll position changed significantly
            if (startLine === currentStartLine && endLine === currentEndLine) {
                return;
            }

            currentStartLine = startLine;
            currentEndLine = endLine;

            // Render visible lines
            const visibleContent = lines.slice(startLine, endLine).join('\n');
            const highlighted = this.syntaxHighlight(visibleContent);

            viewport.innerHTML = highlighted;
            viewport.style.top = (startLine * LINE_HEIGHT) + 'px';
        };

        // Initial render
        renderVisibleLines();

        // Update on scroll with throttling
        let scrollTimeout;
        this.jsonOutput.addEventListener('scroll', () => {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(renderVisibleLines, 16); // ~60fps
        });
    }

    syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="json-' + cls + '">' + match + '</span>';
        });
    }

    onIndentChange() {
        if (this.currentData) {
            // Re-render with new indent, respecting the original render mode
            const input = this.jsonInput.value.trim();
            const jsonSize = new Blob([input]).size;
            const SIZE_THRESHOLD = 500 * 1024;

            if (jsonSize > SIZE_THRESHOLD) {
                this.renderSimpleJSON(this.currentData);
            } else {
                this.renderCollapsibleJSON(this.currentData);
            }
        }
    }

    renderCollapsibleJSON(data, indent = 0) {
        this.jsonOutput.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'json-container';
        this.buildCollapsibleElement(data, container, indent);
        this.jsonOutput.appendChild(container);
    }

    buildCollapsibleElement(data, container, indent) {
        const indentSize = this.indentSize.value;
        const indentChar = indentSize === 'tab' ? '\t' : ' '.repeat(parseInt(indentSize));
        const indentStr = indentChar.repeat(indent);

        if (Array.isArray(data)) {
            if (data.length === 0) {
                container.appendChild(this.createTextNode('[]'));
                return;
            }

            // Use lazy loading for large arrays
            if (data.length > 100) {
                this.buildLazyArray(data, container, indent, indentStr, indentChar);
                return;
            }

            const toggleBtn = this.createToggleButton();
            const openBracket = this.createTextNode('[');

            // Add array size
            const sizeSpan = document.createElement('span');
            sizeSpan.className = 'json-size';
            sizeSpan.textContent = ` // ${data.length} items`;

            const closeBracket = this.createTextNode(indentStr + ']');
            const contentDiv = document.createElement('div');
            contentDiv.className = 'json-collapsible-content';

            container.appendChild(toggleBtn);
            container.appendChild(openBracket);
            container.appendChild(sizeSpan);
            container.appendChild(contentDiv);

            data.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.style.marginLeft = '20px';

                const itemContent = document.createElement('span');
                itemContent.appendChild(this.createTextNode(indentStr + '  '));

                const itemContainer = document.createElement('span');
                this.buildCollapsibleElement(item, itemContainer, indent + 1);
                itemContent.appendChild(itemContainer);

                if (index < data.length - 1) {
                    itemContent.appendChild(this.createTextNode(','));
                }

                itemDiv.appendChild(itemContent);
                contentDiv.appendChild(itemDiv);
            });

            container.appendChild(closeBracket);

            toggleBtn.addEventListener('click', () => {
                contentDiv.classList.toggle('collapsed');
                const isCollapsed = contentDiv.classList.contains('collapsed');
                toggleBtn.textContent = isCollapsed ? '▶' : '▼';
                sizeSpan.style.display = isCollapsed ? 'inline' : 'none';
            });

        } else if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            if (keys.length === 0) {
                container.appendChild(this.createTextNode('{}'));
                return;
            }

            // Use lazy loading for large objects
            if (keys.length > 100) {
                this.buildLazyObject(data, keys, container, indent, indentStr, indentChar);
                return;
            }

            const toggleBtn = this.createToggleButton();
            const openBrace = this.createTextNode('{');

            // Add object size
            const sizeSpan = document.createElement('span');
            sizeSpan.className = 'json-size';
            sizeSpan.textContent = ` // ${keys.length} fields`;

            const closeBrace = this.createTextNode(indentStr + '}');
            const contentDiv = document.createElement('div');
            contentDiv.className = 'json-collapsible-content';

            container.appendChild(toggleBtn);
            container.appendChild(openBrace);
            container.appendChild(sizeSpan);
            container.appendChild(contentDiv);

            keys.forEach((key, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.style.marginLeft = '20px';

                const itemContent = document.createElement('span');
                itemContent.appendChild(this.createTextNode(indentStr + '  '));

                const keySpan = document.createElement('span');
                keySpan.style.color = '#0066cc';
                keySpan.style.fontWeight = 'bold';
                keySpan.textContent = `"${key}"`;
                itemContent.appendChild(keySpan);
                itemContent.appendChild(this.createTextNode(': '));

                const valueContainer = document.createElement('span');
                this.buildCollapsibleElement(data[key], valueContainer, indent + 1);
                itemContent.appendChild(valueContainer);

                if (index < keys.length - 1) {
                    itemContent.appendChild(this.createTextNode(','));
                }

                itemDiv.appendChild(itemContent);
                contentDiv.appendChild(itemDiv);
            });

            container.appendChild(closeBrace);

            toggleBtn.addEventListener('click', () => {
                contentDiv.classList.toggle('collapsed');
                const isCollapsed = contentDiv.classList.contains('collapsed');
                toggleBtn.textContent = isCollapsed ? '▶' : '▼';
                sizeSpan.style.display = isCollapsed ? 'inline' : 'none';
            });

        } else {
            // Primitive values
            const valueSpan = document.createElement('span');
            if (typeof data === 'string') {
                valueSpan.style.color = '#009900';
                valueSpan.textContent = `"${data}"`;
            } else if (typeof data === 'number') {
                valueSpan.style.color = '#ff6600';
                valueSpan.textContent = data;
            } else if (typeof data === 'boolean') {
                valueSpan.style.color = '#cc0066';
                valueSpan.textContent = data;
            } else if (data === null) {
                valueSpan.style.color = '#999999';
                valueSpan.textContent = 'null';
            }
            container.appendChild(valueSpan);
        }
    }

    createToggleButton() {
        const btn = document.createElement('span');
        btn.className = 'json-toggle';
        btn.textContent = '▼';
        btn.style.cursor = 'pointer';
        btn.style.userSelect = 'none';
        btn.style.marginRight = '5px';
        btn.style.color = '#666';
        btn.style.fontWeight = 'bold';
        return btn;
    }

    createTextNode(text) {
        const span = document.createElement('span');
        span.textContent = text;
        return span;
    }

    buildLazyArray(data, container, indent, indentStr, indentChar) {
        const CHUNK_SIZE = 50; // Load 50 items at a time

        const toggleBtn = this.createToggleButton();
        const openBracket = this.createTextNode('[');

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'json-size';
        sizeSpan.textContent = ` // ${data.length} items`;

        const closeBracket = this.createTextNode(indentStr + ']');
        const contentDiv = document.createElement('div');
        contentDiv.className = 'json-collapsible-content';

        container.appendChild(toggleBtn);
        container.appendChild(openBracket);
        container.appendChild(sizeSpan);
        container.appendChild(contentDiv);

        let loadedCount = 0;
        let isExpanded = true;

        const loadMoreBtn = document.createElement('div');
        loadMoreBtn.style.marginLeft = '20px';
        loadMoreBtn.style.color = '#667eea';
        loadMoreBtn.style.cursor = 'pointer';
        loadMoreBtn.style.padding = '5px';
        loadMoreBtn.style.fontStyle = 'italic';

        const loadChunk = () => {
            const endIndex = Math.min(loadedCount + CHUNK_SIZE, data.length);

            for (let index = loadedCount; index < endIndex; index++) {
                const item = data[index];
                const itemDiv = document.createElement('div');
                itemDiv.style.marginLeft = '20px';

                const itemContent = document.createElement('span');
                itemContent.appendChild(this.createTextNode(indentStr + '  '));

                const itemContainer = document.createElement('span');
                this.buildCollapsibleElement(item, itemContainer, indent + 1);
                itemContent.appendChild(itemContainer);

                if (index < data.length - 1) {
                    itemContent.appendChild(this.createTextNode(','));
                }

                itemDiv.appendChild(itemContent);
                contentDiv.insertBefore(itemDiv, loadMoreBtn);
            }

            loadedCount = endIndex;

            if (loadedCount < data.length) {
                loadMoreBtn.textContent = `${indentStr}  ... Load more (${loadedCount}/${data.length} items loaded)`;
            } else {
                loadMoreBtn.remove();
            }
        };

        loadMoreBtn.textContent = `${indentStr}  ... Click to load items (0/${data.length})`;
        loadMoreBtn.addEventListener('click', loadChunk);
        contentDiv.appendChild(loadMoreBtn);

        container.appendChild(closeBracket);

        toggleBtn.addEventListener('click', () => {
            contentDiv.classList.toggle('collapsed');
            const isCollapsed = contentDiv.classList.contains('collapsed');
            toggleBtn.textContent = isCollapsed ? '▶' : '▼';
            sizeSpan.style.display = isCollapsed ? 'inline' : 'none';

            // Auto-load first chunk when expanding for the first time
            if (!isCollapsed && loadedCount === 0) {
                loadChunk();
            }
        });
    }

    buildLazyObject(data, keys, container, indent, indentStr, indentChar) {
        const CHUNK_SIZE = 50; // Load 50 fields at a time

        const toggleBtn = this.createToggleButton();
        const openBrace = this.createTextNode('{');

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'json-size';
        sizeSpan.textContent = ` // ${keys.length} fields`;

        const closeBrace = this.createTextNode(indentStr + '}');
        const contentDiv = document.createElement('div');
        contentDiv.className = 'json-collapsible-content';

        container.appendChild(toggleBtn);
        container.appendChild(openBrace);
        container.appendChild(sizeSpan);
        container.appendChild(contentDiv);

        let loadedCount = 0;

        const loadMoreBtn = document.createElement('div');
        loadMoreBtn.style.marginLeft = '20px';
        loadMoreBtn.style.color = '#667eea';
        loadMoreBtn.style.cursor = 'pointer';
        loadMoreBtn.style.padding = '5px';
        loadMoreBtn.style.fontStyle = 'italic';

        const loadChunk = () => {
            const endIndex = Math.min(loadedCount + CHUNK_SIZE, keys.length);

            for (let index = loadedCount; index < endIndex; index++) {
                const key = keys[index];
                const itemDiv = document.createElement('div');
                itemDiv.style.marginLeft = '20px';

                const itemContent = document.createElement('span');
                itemContent.appendChild(this.createTextNode(indentStr + '  '));

                const keySpan = document.createElement('span');
                keySpan.style.color = '#0066cc';
                keySpan.style.fontWeight = 'bold';
                keySpan.textContent = `"${key}"`;
                itemContent.appendChild(keySpan);
                itemContent.appendChild(this.createTextNode(': '));

                const valueContainer = document.createElement('span');
                this.buildCollapsibleElement(data[key], valueContainer, indent + 1);
                itemContent.appendChild(valueContainer);

                if (index < keys.length - 1) {
                    itemContent.appendChild(this.createTextNode(','));
                }

                itemDiv.appendChild(itemContent);
                contentDiv.insertBefore(itemDiv, loadMoreBtn);
            }

            loadedCount = endIndex;

            if (loadedCount < keys.length) {
                loadMoreBtn.textContent = `${indentStr}  ... Load more (${loadedCount}/${keys.length} fields loaded)`;
            } else {
                loadMoreBtn.remove();
            }
        };

        loadMoreBtn.textContent = `${indentStr}  ... Click to load fields (0/${keys.length})`;
        loadMoreBtn.addEventListener('click', loadChunk);
        contentDiv.appendChild(loadMoreBtn);

        container.appendChild(closeBrace);

        toggleBtn.addEventListener('click', () => {
            contentDiv.classList.toggle('collapsed');
            const isCollapsed = contentDiv.classList.contains('collapsed');
            toggleBtn.textContent = isCollapsed ? '▶' : '▼';
            sizeSpan.style.display = isCollapsed ? 'inline' : 'none';

            // Auto-load first chunk when expanding for the first time
            if (!isCollapsed && loadedCount === 0) {
                loadChunk();
            }
        });
    }

    minifyJSON() {
        const input = this.jsonInput.value.trim();

        if (!input) {
            this.showStatus('Please enter some JSON text to minify', 'error');
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            this.jsonOutput.textContent = minified;
            this.showStatus('JSON minified successfully!', 'success');
        } catch (error) {
            this.displayDetailedError(error, input);
        }
    }

    validateJSON() {
        const input = this.jsonInput.value.trim();

        if (!input) {
            this.showStatus('Please enter some JSON text to validate', 'error');
            return;
        }

        try {
            JSON.parse(input);
            this.showStatus('✅ Valid JSON!', 'success');
        } catch (error) {
            this.displayDetailedError(error, input);
        }
    }

    clearAll() {
        this.jsonInput.value = '';
        this.jsonOutput.textContent = '';
        this.currentData = null;
        this.hideStatus();
        this.jsonInput.focus();
    }

    uploadFile() {
        this.fileInput.click();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            this.showStatus('Please select a valid JSON file', 'error');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                this.jsonInput.value = content;
                this.formatJSON();
                this.showStatus(`File "${file.name}" loaded successfully!`, 'success');
            } catch (error) {
                this.showStatus(`Error reading file: ${error.message}`, 'error');
            }
        };

        reader.onerror = () => {
            this.showStatus('Error reading file', 'error');
        };

        reader.readAsText(file);

        // Reset file input so same file can be uploaded again
        this.fileInput.value = '';
    }

    downloadJSON() {
        if (!this.currentData) {
            this.showStatus('No formatted JSON to download', 'error');
            return;
        }

        try {
            const indentSize = this.indentSize.value;
            const indent = indentSize === 'tab' ? '\t' : parseInt(indentSize);
            const jsonString = JSON.stringify(this.currentData, null, indent);

            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'formatted.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showStatus('JSON downloaded successfully!', 'success');
        } catch (error) {
            this.showStatus(`Failed to download: ${error.message}`, 'error');
        }
    }

    expandAll() {
        const collapsedElements = this.jsonOutput.querySelectorAll('.json-collapsible-content.collapsed');
        collapsedElements.forEach(element => {
            element.classList.remove('collapsed');

            // Find the toggle button and size span
            const prevSibling = element.previousElementSibling;
            let current = prevSibling;
            let toggle = null;
            let sizeSpan = null;

            while (current) {
                if (current.classList && current.classList.contains('json-toggle')) {
                    toggle = current;
                }
                if (current.classList && current.classList.contains('json-size')) {
                    sizeSpan = current;
                }
                current = current.previousElementSibling;
            }

            if (toggle) {
                toggle.textContent = '▼';
            }
            if (sizeSpan) {
                sizeSpan.style.display = 'none';
            }
        });
        if (collapsedElements.length > 0) {
            this.showStatus('All sections expanded', 'success');
        }
    }

    collapseAll() {
        const expandedElements = this.jsonOutput.querySelectorAll('.json-collapsible-content:not(.collapsed)');
        expandedElements.forEach(element => {
            element.classList.add('collapsed');

            // Find the toggle button and size span
            const prevSibling = element.previousElementSibling;
            let current = prevSibling;
            let toggle = null;
            let sizeSpan = null;

            while (current) {
                if (current.classList && current.classList.contains('json-toggle')) {
                    toggle = current;
                }
                if (current.classList && current.classList.contains('json-size')) {
                    sizeSpan = current;
                }
                current = current.previousElementSibling;
            }

            if (toggle) {
                toggle.textContent = '▶';
            }
            if (sizeSpan) {
                sizeSpan.style.display = 'inline';
            }
        });
        if (expandedElements.length > 0) {
            this.showStatus('All sections collapsed', 'success');
        }
    }

    async copyToClipboard() {
        if (!this.currentData) {
            this.showStatus('No formatted JSON to copy', 'error');
            return;
        }

        try {
            const indentSize = this.indentSize.value;
            const indent = indentSize === 'tab' ? '\t' : parseInt(indentSize);
            const jsonString = JSON.stringify(this.currentData, null, indent);

            await navigator.clipboard.writeText(jsonString);
            this.showStatus('Copied to clipboard!', 'success');
        } catch (error) {
            this.fallbackCopyToClipboard();
        }
    }

    fallbackCopyToClipboard() {
        const indentSize = this.indentSize.value;
        const indent = indentSize === 'tab' ? '\t' : parseInt(indentSize);
        const jsonString = JSON.stringify(this.currentData, null, indent);

        const textArea = document.createElement('textarea');
        textArea.value = jsonString;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showStatus('Copied to clipboard!', 'success');
        } catch (error) {
            this.showStatus('Failed to copy to clipboard', 'error');
        }

        document.body.removeChild(textArea);
    }

    autoFormat() {
        const input = this.jsonInput.value.trim();
        if (input && this.isValidJSON(input)) {
            this.formatJSON();
        }
    }

    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (error) {
            return false;
        }
    }


    displayDetailedError(error, input) {
        this.jsonOutput.innerHTML = '';

        // Extract position from error message if available
        const positionMatch = error.message.match(/position (\d+)/);
        let errorPosition = positionMatch ? parseInt(positionMatch[1]) : -1;

        // Create error display
        const errorContainer = document.createElement('div');
        errorContainer.style.color = '#721c24';
        errorContainer.style.padding = '15px';
        errorContainer.style.backgroundColor = '#f8d7da';
        errorContainer.style.border = '1px solid #f5c6cb';
        errorContainer.style.borderRadius = '6px';

        // Error title
        const errorTitle = document.createElement('div');
        errorTitle.style.fontWeight = 'bold';
        errorTitle.style.marginBottom = '10px';
        errorTitle.style.fontSize = '16px';
        errorTitle.textContent = '❌ Invalid JSON';
        errorContainer.appendChild(errorTitle);

        // Error message
        const errorMsg = document.createElement('div');
        errorMsg.style.marginBottom = '10px';
        errorMsg.textContent = `Error: ${error.message}`;
        errorContainer.appendChild(errorMsg);

        // Show position and context
        if (errorPosition >= 0) {
            const lineInfo = this.getLineAndColumn(input, errorPosition);

            const posInfo = document.createElement('div');
            posInfo.style.marginBottom = '10px';
            posInfo.innerHTML = `Location: Line ${lineInfo.line}, Column ${lineInfo.column}`;
            errorContainer.appendChild(posInfo);

            // Show code snippet with error highlight
            const codeSnippet = document.createElement('pre');
            codeSnippet.style.backgroundColor = '#fff';
            codeSnippet.style.padding = '10px';
            codeSnippet.style.borderRadius = '4px';
            codeSnippet.style.overflow = 'auto';
            codeSnippet.style.fontSize = '13px';
            codeSnippet.style.fontFamily = 'Courier New, monospace';

            const lines = input.split('\n');
            const contextStart = Math.max(0, lineInfo.line - 3);
            const contextEnd = Math.min(lines.length, lineInfo.line + 2);

            let snippet = '';
            for (let i = contextStart; i < contextEnd; i++) {
                const lineNum = i + 1;
                const line = lines[i];

                if (lineNum === lineInfo.line) {
                    snippet += `<span style="background-color: #ffdddd; display: block; padding: 2px 0;">${lineNum}: ${this.escapeHtml(line)}</span>`;
                    snippet += `<span style="color: #d32f2f; display: block; padding: 2px 0;">${' '.repeat(String(lineNum).length + 2 + lineInfo.column - 1)}^</span>`;
                } else {
                    snippet += `${lineNum}: ${this.escapeHtml(line)}\n`;
                }
            }

            codeSnippet.innerHTML = snippet;
            errorContainer.appendChild(codeSnippet);
        }

        // Common errors help
        const helpSection = document.createElement('div');
        helpSection.style.marginTop = '10px';
        helpSection.style.fontSize = '13px';
        helpSection.innerHTML = '<strong>Common issues:</strong><br/>' +
            '• Missing or extra commas<br/>' +
            '• Unquoted keys (use "key" not key)<br/>' +
            '• Single quotes (use " not \')<br/>' +
            '• Trailing commas in objects/arrays<br/>' +
            '• Unclosed brackets or braces';
        errorContainer.appendChild(helpSection);

        this.jsonOutput.appendChild(errorContainer);
        this.showStatus(`❌ Invalid JSON: ${error.message}`, 'error');
    }

    getLineAndColumn(text, position) {
        const lines = text.substring(0, position).split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;

        setTimeout(() => {
            this.hideStatus();
        }, 3000);
    }

    hideStatus() {
        this.statusMessage.style.display = 'none';
        this.statusMessage.className = 'status-message';
    }

    handleSearch() {
        const query = this.searchInput.value.trim();

        if (!query) {
            this.clearSearchHighlight();
            this.searchResults.textContent = '';
            return;
        }

        if (!this.currentData) {
            this.searchResults.textContent = 'No JSON loaded';
            return;
        }

        // Search in the JSON data
        const jsonString = JSON.stringify(this.currentData, null, 2);
        const matches = this.findAllMatches(jsonString, query);

        if (matches.length === 0) {
            this.searchResults.textContent = 'No results';
            this.clearSearchHighlight();
        } else {
            this.searchResults.textContent = `${matches.length} result${matches.length > 1 ? 's' : ''}`;
            this.highlightSearchResults(query);
        }
    }

    findAllMatches(text, query) {
        const matches = [];
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        let pos = 0;

        while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
            matches.push(pos);
            pos += query.length;
        }

        return matches;
    }

    highlightSearchResults(query) {
        const outputText = this.jsonOutput.textContent || this.jsonOutput.innerText;

        if (!outputText) return;

        const lowerQuery = query.toLowerCase();
        const lowerText = outputText.toLowerCase();

        let highlightedHTML = '';
        let lastIndex = 0;

        let pos = lowerText.indexOf(lowerQuery);
        while (pos !== -1) {
            // Add text before match
            highlightedHTML += this.escapeHtml(outputText.substring(lastIndex, pos));
            // Add highlighted match
            highlightedHTML += '<mark style="background-color: #ffeb3b; color: #000; padding: 2px 0;">' +
                              this.escapeHtml(outputText.substring(pos, pos + query.length)) +
                              '</mark>';
            lastIndex = pos + query.length;
            pos = lowerText.indexOf(lowerQuery, lastIndex);
        }

        // Add remaining text
        highlightedHTML += this.escapeHtml(outputText.substring(lastIndex));

        this.jsonOutput.innerHTML = highlightedHTML;
    }

    clearSearchHighlight() {
        if (this.currentData) {
            // Re-render to remove highlights
            const input = this.jsonInput.value.trim();
            const jsonSize = new Blob([input]).size;
            const SIZE_THRESHOLD = 500 * 1024;

            if (jsonSize > SIZE_THRESHOLD) {
                this.renderSimpleJSON(this.currentData);
            } else {
                this.renderCollapsibleJSON(this.currentData);
            }
        }
    }

    enableCollapseButtons() {
        this.expandAllBtn.disabled = false;
        this.collapseAllBtn.disabled = false;
        this.expandAllBtn.style.opacity = '1';
        this.collapseAllBtn.style.opacity = '1';
        this.expandAllBtn.style.cursor = 'pointer';
        this.collapseAllBtn.style.cursor = 'pointer';
    }

    disableCollapseButtons() {
        this.expandAllBtn.disabled = true;
        this.collapseAllBtn.disabled = true;
        this.expandAllBtn.style.opacity = '0.5';
        this.collapseAllBtn.style.opacity = '0.5';
        this.expandAllBtn.style.cursor = 'not-allowed';
        this.collapseAllBtn.style.cursor = 'not-allowed';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const formatter = new JSONFormatter();

    const examples = [
        '{"name": "John Doe", "age": 30, "city": "New York"}',
        '[{"id": 1, "name": "Apple", "price": 1.2}, {"id": 2, "name": "Banana", "price": 0.8}]'
    ];

    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    document.getElementById('jsonInput').placeholder = `Paste your JSON string here...\n\nExample:\n${randomExample}`;

    // Check for test data from localStorage
    const testJSON = localStorage.getItem('testJSON');
    if (testJSON) {
        localStorage.removeItem('testJSON'); // Clear after loading
        document.getElementById('jsonInput').value = testJSON;
        formatter.formatJSON();
    }
});