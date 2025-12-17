/**
 * Theme Manager Module
 * Handles light/dark theme switching
 */

export class ThemeManager {
    constructor() {
        this.theme = this.getInitialTheme();
        this.applyTheme();
    }

    /**
     * Get initial theme from localStorage or system preference
     */
    getInitialTheme() {
        const stored = localStorage.getItem('theme');
        if (stored) {
            return stored;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    /**
     * Toggle between light and dark
     */
    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
    }

    /**
     * Apply theme to document
     */
    applyTheme() {
        // Use requestAnimationFrame for smooth transition
        requestAnimationFrame(() => {
            document.documentElement.setAttribute('data-theme', this.theme);
        });
    }

    /**
     * Save theme to localStorage
     */
    saveTheme() {
        localStorage.setItem('theme', this.theme);
    }

    /**
     * Get current theme
     */
    getTheme() {
        return this.theme;
    }
}
