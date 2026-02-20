// Apply saved/system theme immediately (called inline in <head> to avoid flash)
function applyThemeOnLoad() {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
}

// Wire up the toggle button (called after DOM ready)
function initThemeToggle() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;

    function isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    function updateIcon() {
        btn.textContent = isDark() ? '☀' : '☾';
        btn.title = isDark() ? 'Switch to light mode' : 'Switch to dark mode';
    }

    btn.addEventListener('click', function () {
        var newTheme = isDark() ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon();
    });

    updateIcon();
}

document.addEventListener('DOMContentLoaded', initThemeToggle);
