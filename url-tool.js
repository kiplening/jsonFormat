class URLTool {
    constructor() {
        this.urlInput = document.getElementById('urlInput');
        this.urlOutput = document.getElementById('urlOutput');
        this.message = document.getElementById('message');

        this.encodeBtn = document.getElementById('encodeBtn');
        this.decodeBtn = document.getElementById('decodeBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyBtn = document.getElementById('copyBtn');

        this.initEventListeners();
    }

    initEventListeners() {
        this.encodeBtn.addEventListener('click', () => this.encode());
        this.decodeBtn.addEventListener('click', () => this.decode());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());

        this.urlInput.addEventListener('input', () => this.hideMessage());
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

    decode() {
        const input = this.urlInput.value.trim();

        if (!input) {
            this.showMessage('Please enter some URL-encoded text to decode', 'error');
            return;
        }

        try {
            const decoded = decodeURIComponent(input);
            this.urlOutput.value = decoded;
            this.showMessage('URL decoded successfully!', 'success');
        } catch (error) {
            this.showMessage(`Failed to decode: ${error.message}`, 'error');
        }
    }

    clearAll() {
        this.urlInput.value = '';
        this.urlOutput.value = '';
        this.hideMessage();
        this.urlInput.focus();
    }

    async copyToClipboard() {
        const output = this.urlOutput.value;

        if (!output) {
            this.showMessage('No output to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(output);
            this.showMessage('Copied to clipboard!', 'success');
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
