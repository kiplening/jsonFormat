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
            this.showStatus(`Invalid JSON: ${error.message}`, 'error');
            this.jsonOutput.textContent = '';
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
            this.showStatus(`Invalid JSON: ${error.message}`, 'error');
            this.jsonOutput.textContent = '';
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
            this.showStatus(`❌ Invalid JSON: ${error.message}`, 'error');
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