/**
 * Settings management for the Pomodoro Timer
 */

// Settings functionality
class SettingsManager {
    constructor() {
        this.settingsForm = document.getElementById('settings-form');
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsBtn = document.getElementById('settings-btn');
        this.closeBtn = document.getElementById('close-settings');
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.themeIcon = document.getElementById('theme-icon');

        this.initializeEventListeners();
        this.detectSystemTheme();
        this.loadSettings();
        this.applyTheme();
    }

    initializeEventListeners() {
        // Open settings modal
        this.settingsBtn.addEventListener('click', () => {
            this.settingsModal.classList.add('show');
        });

        // Close settings modal
        this.closeBtn.addEventListener('click', () => {
            this.settingsModal.classList.remove('show');
        });

        // Close modal when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.settingsModal.classList.remove('show');
            }
        });

        // Handle form submission
        this.settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
            this.settingsModal.classList.remove('show');

            // Track event
            trackEvent('Settings', 'Save', 'Settings updated');
        });

        // Theme toggle
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => {
                const settings = this.loadSettings();
                const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
                settings.theme = newTheme;
                localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
                this.applyTheme(newTheme);

                // Track event
                trackEvent('Settings', 'ThemeChange', `Theme changed to ${newTheme}`);
            });
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                const savedSettings = JSON.parse(localStorage.getItem('pomodoroSettings')) || {};
                // Only apply system theme if not explicitly set by user
                if (!savedSettings.hasOwnProperty('theme')) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(newTheme);
                    savedSettings.theme = newTheme;
                    localStorage.setItem('pomodoroSettings', JSON.stringify(savedSettings));
                }
            });
        }
    }

    detectSystemTheme() {
        if (window.matchMedia && !localStorage.getItem('pomodoroSettings')) {
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const defaultSettings = {
                workDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                soundEnabled: true,
                showTimeInTitle: true,
                autoStartEnabled: false,
                soundType: 'beep',
                soundVolume: 0.75,
                theme: prefersDarkMode ? 'dark' : 'light'
            };
            localStorage.setItem('pomodoroSettings', JSON.stringify(defaultSettings));
        }
    }

    applyTheme(theme) {
        const settings = this.loadSettings();
        theme = theme || settings.theme || 'light';

        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (this.themeIcon) this.themeIcon.textContent = '☀️';
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (this.themeIcon) this.themeIcon.textContent = '🌙';
        }
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('pomodoroSettings')) || {
            workDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            soundEnabled: true,
            showTimeInTitle: true,
            autoStartEnabled: false,
            soundType: 'beep',
            soundVolume: 0.75,
            theme: 'light'
        };

        document.getElementById('work-duration').value = settings.workDuration;
        document.getElementById('short-break-duration').value = settings.shortBreakDuration;
        document.getElementById('long-break-duration').value = settings.longBreakDuration;
        document.getElementById('sound-enabled').checked = settings.soundEnabled;
        document.getElementById('show-time-in-title').checked = settings.showTimeInTitle;
        document.getElementById('auto-start-enabled').checked = settings.autoStartEnabled !== undefined ? settings.autoStartEnabled : false;
        document.getElementById('sound-type').value = settings.soundType;
        document.getElementById('sound-volume').value = settings.soundVolume;
        document.getElementById('theme-select').value = settings.theme || 'light';

        return settings;
    }

    saveSettings() {
        const settings = {
            workDuration: parseInt(document.getElementById('work-duration').value),
            shortBreakDuration: parseInt(document.getElementById('short-break-duration').value),
            longBreakDuration: parseInt(document.getElementById('long-break-duration').value),
            soundEnabled: document.getElementById('sound-enabled').checked,
            showTimeInTitle: document.getElementById('show-time-in-title').checked,
            autoStartEnabled: document.getElementById('auto-start-enabled').checked,
            soundType: document.getElementById('sound-type').value,
            soundVolume: parseFloat(document.getElementById('sound-volume').value),
            theme: document.getElementById('theme-select').value
        };

        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
        this.applyTheme(settings.theme);

        // Update timer settings and display
        if (window.timer) {
            window.timer.updateSettings(settings);
        }
    }
}

// Initialize settings manager when the page loads
let settingsManager;
document.addEventListener('DOMContentLoaded', () => {
    settingsManager = new SettingsManager();
}); 