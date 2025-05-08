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
        this.mouseDownTarget = null;
        this.testSoundBtn = document.getElementById('test-sound-btn');

        this.initializeEventListeners();
        this.detectSystemTheme();
        this.loadSettings();
        this.applyTheme();
    }

    initializeEventListeners() {
        // Open settings modal
        this.settingsBtn.addEventListener('click', () => {
            this.settingsModal.classList.add('show');
            // Reload saved settings to discard any unsaved changes from previous openings
            this.loadSettings();
        });

        // Close settings modal
        this.closeBtn.addEventListener('click', () => {
            this.settingsModal.classList.remove('show');
        });

        // Track where the mouse down event started
        document.addEventListener('mousedown', (e) => {
            if (this.settingsModal.classList.contains('show')) {
                this.mouseDownTarget = e.target;
            }
        });

        // Close modal only on complete click outside (mousedown and mouseup on the modal background)
        document.addEventListener('mouseup', (e) => {
            if (this.settingsModal.classList.contains('show') &&
                e.target === this.settingsModal &&
                this.mouseDownTarget === this.settingsModal) {
                this.settingsModal.classList.remove('show');
            }
            this.mouseDownTarget = null;
        });

        // Handle form submission
        this.settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
            this.settingsModal.classList.remove('show');

            // Track event
            trackEvent('Settings', 'Save', 'Settings updated');
        });

        // Test sound button
        if (this.testSoundBtn) {
            this.testSoundBtn.addEventListener('click', () => {
                // Create temporary settings object with current form values
                const tempSettings = {
                    soundType: document.getElementById('sound-type').value,
                    soundVolume: parseFloat(document.getElementById('sound-volume').value)
                };

                // Check if window.timer and playSound are available
                if (window.timer && typeof window.timer.playSound === 'function') {
                    window.timer.playSound(tempSettings);
                } else {
                    this.playTestSound(tempSettings);
                }

                // Track event
                if (typeof trackEvent === 'function') {
                    trackEvent('Settings', 'TestSound', `Sound tested: ${tempSettings.soundType}`);
                }
            });
        }

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

    // Fallback function to play sound if window.timer is not available
    playTestSound(settings) {
        // Se o volume for zero, não reproduzir o som
        if (settings.soundVolume <= 0) return;

        // Define sound configurations
        const SOUND_CONFIGS = {
            beep: {
                frequency: 800,
                type: 'sine'
            },
            bell: {
                frequency: 440,
                type: 'triangle'
            },
            alarm: {
                frequency: 600,
                type: 'square'
            },
            notification: {
                frequency: 520,
                type: 'sine'
            }
        };

        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const soundConfig = SOUND_CONFIGS[settings.soundType] || SOUND_CONFIGS.beep;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = soundConfig.type;
        oscillator.frequency.setValueAtTime(soundConfig.frequency, audioContext.currentTime);

        // Apply volume setting
        const volume = settings.soundVolume;
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
    }

    detectSystemTheme() {
        if (window.matchMedia && !localStorage.getItem('pomodoroSettings')) {
            const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const defaultSettings = {
                workDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                showTimeInTitle: true,
                autoStartEnabled: false,
                browserNotificationsEnabled: false,
                soundType: 'bell',
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
            showTimeInTitle: true,
            autoStartEnabled: false,
            browserNotificationsEnabled: false,
            soundType: 'bell',
            soundVolume: 0.75,
            theme: 'light'
        };

        document.getElementById('work-duration').value = settings.workDuration;
        document.getElementById('short-break-duration').value = settings.shortBreakDuration;
        document.getElementById('long-break-duration').value = settings.longBreakDuration;
        document.getElementById('show-time-in-title').checked = settings.showTimeInTitle;
        document.getElementById('auto-start-enabled').checked = settings.autoStartEnabled !== undefined ? settings.autoStartEnabled : false;
        document.getElementById('browser-notifications-enabled').checked = settings.browserNotificationsEnabled !== undefined ? settings.browserNotificationsEnabled : false;
        document.getElementById('sound-type').value = settings.soundType;
        document.getElementById('sound-volume').value = settings.soundVolume;
        document.getElementById('theme-select').value = settings.theme || 'light';

        // Atualizar o gerenciador de notificações se disponível
        if (window.notificationManager) {
            window.notificationManager.setEnabled(settings.browserNotificationsEnabled);
        }

        return settings;
    }

    saveSettings() {
        const settings = {
            workDuration: parseInt(document.getElementById('work-duration').value),
            shortBreakDuration: parseInt(document.getElementById('short-break-duration').value),
            longBreakDuration: parseInt(document.getElementById('long-break-duration').value),
            showTimeInTitle: document.getElementById('show-time-in-title').checked,
            autoStartEnabled: document.getElementById('auto-start-enabled').checked,
            browserNotificationsEnabled: document.getElementById('browser-notifications-enabled').checked,
            soundType: document.getElementById('sound-type').value,
            soundVolume: parseFloat(document.getElementById('sound-volume').value),
            theme: document.getElementById('theme-select').value
        };

        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
        this.applyTheme(settings.theme);

        // Atualizar o gerenciador de notificações se disponível
        if (window.notificationManager) {
            window.notificationManager.setEnabled(settings.browserNotificationsEnabled);
        }

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

    // Expor para uso global
    window.settingsManager = settingsManager;
}); 