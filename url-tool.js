class URLTool {
    constructor() {
        this.urlInput = document.getElementById('urlInput');
        this.urlOutput = document.getElementById('urlOutput');
        this.paramsOutput = document.getElementById('paramsOutput');
        this.urlInfoSection = document.getElementById('urlInfoSection');
        this.message = document.getElementById('message');

        this.encodeBtn = document.getElementById('encodeBtn');
        this.decodeBtn = document.getElementById('decodeBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyBtn = document.getElementById('copyBtn');

        this.parsedParams = null;

        this.initEventListeners();
    }

    initEventListeners() {
        this.encodeBtn.addEventListener('click', () => this.encode());
        this.decodeBtn.addEventListener('click', () => this.decodeURL());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());

        this.urlInput.addEventListener('input', () => this.hideMessage());

        // Double-click a component value to copy it
        document.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('component-value')) {
                const text = e.target.textContent;
                if (text && text !== '(default)' && text !== '(none)') {
                    this.copyText(text);
                }
            }
        });
    }

    encode() {
        const input = this.urlInput.value.trim();

        if (!input) {
            this.showMessage('Please enter some text to encode', 'error');
            return;
        }

        try {
            const encoded = encodeURIComponent(input);
            this.urlOutput.value = encoded;
            this.showMessage('URL encoded successfully!', 'success');
        } catch (error) {
            this.showMessage(`Failed to encode: ${error.message}`, 'error');
        }
    }

    decodeURL() {
        const input = this.urlInput.value.trim();

        if (!input) {
            this.showMessage('Please enter a URL to decode', 'error');
            return;
        }

        try {
            // Try to parse as URL first
            let url;
            try {
                url = new URL(input);
            } catch {
                // If not a full URL, try to decode as simple text
                const decoded = decodeURIComponent(input);
                this.urlOutput.value = decoded;
                this.urlInfoSection.style.display = 'none';
                this.showMessage('Text decoded successfully!', 'success');
                return;
            }

            // Decode the URL
            const decoded = decodeURIComponent(input);
            this.urlOutput.value = decoded;

            // Display URL components
            const setComponent = (id, value) => {
                const el = document.getElementById(id);
                el.textContent = value;
                const copyable = value && value !== '(default)' && value !== '(none)';
                el.title = copyable ? `${value}\n(Double-click to copy)` : value;
            };
            setComponent('infoProtocol', url.protocol);
            setComponent('infoDomain', url.hostname);
            setComponent('infoPort', url.port || '(default)');
            setComponent('infoPath', url.pathname || '/');
            setComponent('infoHash', url.hash || '(none)');

            // Extract and display query parameters as JSON
            const params = {};
            url.searchParams.forEach((value, key) => {
                if (params[key]) {
                    // Handle duplicate keys as array
                    if (Array.isArray(params[key])) {
                        params[key].push(value);
                    } else {
                        params[key] = [params[key], value];
                    }
                } else {
                    params[key] = value;
                }
            });

            // Always show URL info section
            this.urlInfoSection.style.display = 'block';

            // Show params if there are any
            if (Object.keys(params).length > 0) {
                this.parsedParams = params;
                const paramsJson = JSON.stringify(params, null, 2);
                this.paramsOutput.innerHTML = this.syntaxHighlight(paramsJson);
                this.showMessage('URL decoded and parameters extracted!', 'success');
            } else {
                this.parsedParams = null;
                this.paramsOutput.innerHTML = '<span style="color: #999; font-style: italic;">No query parameters</span>';
                this.showMessage('URL decoded successfully!', 'success');
            }
        } catch (error) {
            this.showMessage(`Failed to decode: ${error.message}`, 'error');
        }
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

    clearAll() {
        this.urlInput.value = '';
        this.urlOutput.value = '';
        this.urlInfoSection.style.display = 'none';
        this.parsedParams = null;
        this.hideMessage();
        this.urlInput.focus();
    }

    async copyToClipboard() {
        const output = this.urlOutput.value;

        if (!output) {
            this.showMessage('No output to copy', 'error');
            return;
        }

        this.copyText(output);
    }

    async copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showMessage('Copied to clipboard!', 'success');
        } catch (error) {
            this.fallbackCopyToClipboard(text);
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
            this.showMessage('Copied to clipboard!', 'success');
        } catch (error) {
            this.showMessage('Failed to copy to clipboard', 'error');
        }

        document.body.removeChild(textArea);
    }

    showMessage(text, type) {
        this.message.style.display = '';
        this.message.textContent = text;
        this.message.className = `message ${type}`;

        setTimeout(() => {
            this.hideMessage();
        }, 3000);
    }

    hideMessage() {
        this.message.style.display = 'none';
        this.message.className = 'message';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new URLTool();
});
