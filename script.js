class JSONFormatter {
    constructor() {
        this.jsonInput = document.getElementById('jsonInput');
        this.jsonOutput = document.getElementById('jsonOutput');
        this.statusMessage = document.getElementById('statusMessage');

        this.formatBtn = document.getElementById('formatBtn');
        this.minifyBtn = document.getElementById('minifyBtn');
        this.validateBtn = document.getElementById('validateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyBtn = document.getElementById('copyBtn');

        this.initEventListeners();
    }

    initEventListeners() {
        this.formatBtn.addEventListener('click', () => this.formatJSON());
        this.minifyBtn.addEventListener('click', () => this.minifyJSON());
        this.validateBtn.addEventListener('click', () => this.validateJSON());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());

        this.jsonInput.addEventListener('input', () => this.hideStatus());
        this.jsonInput.addEventListener('paste', () => {
            setTimeout(() => this.autoFormat(), 100);
        });
    }

    formatJSON() {
        const input = this.jsonInput.value.trim();

        if (!input) {
            this.showStatus('Please enter some JSON text to format', 'error');
            return;
        }

        try {
            const parsed = JSON.parse(input);
            this.renderCollapsibleJSON(parsed);
            this.showStatus('JSON formatted successfully!', 'success');
        } catch (error) {
            this.displayDetailedError(error, input);
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
        const indentStr = '  '.repeat(indent);

        if (Array.isArray(data)) {
            if (data.length === 0) {
                container.appendChild(this.createTextNode('[]'));
                return;
            }

            const toggleBtn = this.createToggleButton();
            const openBracket = this.createTextNode('[');
            const closeBracket = this.createTextNode(indentStr + ']');
            const contentDiv = document.createElement('div');
            contentDiv.className = 'json-collapsible-content';

            container.appendChild(toggleBtn);
            container.appendChild(openBracket);
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
                toggleBtn.textContent = contentDiv.classList.contains('collapsed') ? '▶' : '▼';
            });

        } else if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            if (keys.length === 0) {
                container.appendChild(this.createTextNode('{}'));
                return;
            }

            const toggleBtn = this.createToggleButton();
            const openBrace = this.createTextNode('{');
            const closeBrace = this.createTextNode(indentStr + '}');
            const contentDiv = document.createElement('div');
            contentDiv.className = 'json-collapsible-content';

            container.appendChild(toggleBtn);
            container.appendChild(openBrace);
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
                toggleBtn.textContent = contentDiv.classList.contains('collapsed') ? '▶' : '▼';
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
        this.hideStatus();
        this.jsonInput.focus();
    }

    async copyToClipboard() {
        const output = this.jsonOutput.textContent;

        if (!output) {
            this.showStatus('No formatted JSON to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(output);
            this.showStatus('Copied to clipboard!', 'success');
        } catch (error) {
            this.fallbackCopyToClipboard(output);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
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
}

document.addEventListener('DOMContentLoaded', () => {
    new JSONFormatter();

    const examples = [
        '{"name": "John Doe", "age": 30, "city": "New York"}',
        '[{"id": 1, "name": "Apple", "price": 1.2}, {"id": 2, "name": "Banana", "price": 0.8}]'
    ];

    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    document.getElementById('jsonInput').placeholder = `Paste your JSON string here...\n\nExample:\n${randomExample}`;
});