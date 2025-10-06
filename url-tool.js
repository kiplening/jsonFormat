class URLTool {
    constructor() {
        this.urlInput = document.getElementById('urlInput');
        this.encodeInput = document.getElementById('encodeInput');
        this.encodeOutput = document.getElementById('encodeOutput');
        this.message = document.getElementById('message');
        this.parsedSection = document.getElementById('parsedSection');

        this.parseBtn = document.getElementById('parseBtn');
        this.encodeBtn = document.getElementById('encodeBtn');
        this.decodeBtn = document.getElementById('decodeBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyEncodeBtn = document.getElementById('copyEncodeBtn');

        this.parsedData = null;

        this.initEventListeners();
    }

    initEventListeners() {
        this.parseBtn.addEventListener('click', () => this.parseURL());
        this.encodeBtn.addEventListener('click', () => this.encode());
        this.decodeBtn.addEventListener('click', () => this.decode());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyEncodeBtn.addEventListener('click', () => this.copyEncodeOutput());

        this.urlInput.addEventListener('input', () => this.hideMessage());

        // Copy buttons
        document.querySelectorAll('.btn-copy-small').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const copyType = e.target.getAttribute('data-copy');
                this.copyPart(copyType);
            });
        });

        // Auto-parse on Enter
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.parseURL();
            }
        });
    }

    parseURL() {
        const input = this.urlInput.value.trim();

        if (!input) {
            this.showMessage('Please enter a URL to parse', 'error');
            return;
        }

        try {
            const url = new URL(input);

            // Extract query parameters
            const params = {};
            url.searchParams.forEach((value, key) => {
                // Handle multiple values with same key
                if (params[key]) {
                    if (Array.isArray(params[key])) {
                        params[key].push(value);
                    } else {
                        params[key] = [params[key], value];
                    }
                } else {
                    params[key] = value;
                }
            });

            this.parsedData = {
                protocol: url.protocol,
                host: url.host,
                hostname: url.hostname,
                port: url.port || '(default)',
                pathname: url.pathname,
                params: params,
                hash: url.hash || '(none)'
            };

            this.displayParsedURL();
            this.showMessage('URL parsed successfully!', 'success');
        } catch (error) {
            this.showMessage(`Invalid URL: ${error.message}`, 'error');
        }
    }

    displayParsedURL() {
        if (!this.parsedData) return;

        // Show parsed section
        this.parsedSection.style.display = 'block';

        // Display basic info
        document.getElementById('protocol').textContent = this.parsedData.protocol;
        document.getElementById('host').textContent = this.parsedData.host;
        document.getElementById('port').textContent = this.parsedData.port;
        document.getElementById('pathname').textContent = this.parsedData.pathname;
        document.getElementById('hash').textContent = this.parsedData.hash;

        // Display params as formatted JSON
        const paramsJson = JSON.stringify(this.parsedData.params, null, 2);
        const highlighted = this.syntaxHighlight(paramsJson);
        document.getElementById('paramsJson').innerHTML = highlighted;
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

    copyPart(type) {
        if (!this.parsedData) return;

        let textToCopy = '';

        switch (type) {
            case 'protocol':
                textToCopy = `${this.parsedData.protocol}//${this.parsedData.host}${this.parsedData.pathname}`;
                break;
            case 'params':
                textToCopy = JSON.stringify(this.parsedData.params, null, 2);
                break;
            case 'hash':
                textToCopy = this.parsedData.hash;
                break;
        }

        this.copyToClipboard(textToCopy);
    }

    encode() {
        const input = this.encodeInput.value.trim();

        if (!input) {
            this.showMessage('Please enter some text to encode', 'error');
            return;
        }

        try {
            const encoded = encodeURIComponent(input);
            this.encodeOutput.value = encoded;
            this.showMessage('Text encoded successfully!', 'success');
        } catch (error) {
            this.showMessage(`Failed to encode: ${error.message}`, 'error');
        }
    }

    decode() {
        const input = this.encodeInput.value.trim();

        if (!input) {
            this.showMessage('Please enter some text to decode', 'error');
            return;
        }

        try {
            const decoded = decodeURIComponent(input);
            this.encodeOutput.value = decoded;
            this.showMessage('Text decoded successfully!', 'success');
        } catch (error) {
            this.showMessage(`Failed to decode: ${error.message}`, 'error');
        }
    }

    clearAll() {
        this.urlInput.value = '';
        this.encodeInput.value = '';
        this.encodeOutput.value = '';
        this.parsedSection.style.display = 'none';
        this.parsedData = null;
        this.hideMessage();
        this.urlInput.focus();
    }

    copyEncodeOutput() {
        const output = this.encodeOutput.value;

        if (!output) {
            this.showMessage('No output to copy', 'error');
            return;
        }

        this.copyToClipboard(output);
    }

    async copyToClipboard(text) {
        if (!text) {
            this.showMessage('Nothing to copy', 'error');
            return;
        }

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
