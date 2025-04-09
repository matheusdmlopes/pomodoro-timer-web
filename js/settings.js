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

        this.initializeEventListeners();
        this.loadSettings();
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
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('pomodoroSettings')) || {
            workDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            soundEnabled: true,
            showTimeInTitle: true,
            soundType: 'beep',
            soundVolume: 0.75
        };

        document.getElementById('work-duration').value = settings.workDuration;
        document.getElementById('short-break-duration').value = settings.shortBreakDuration;
        document.getElementById('long-break-duration').value = settings.longBreakDuration;
        document.getElementById('sound-enabled').checked = settings.soundEnabled;
        document.getElementById('show-time-in-title').checked = settings.showTimeInTitle;
        document.getElementById('sound-type').value = settings.soundType;
        document.getElementById('sound-volume').value = settings.soundVolume;

        return settings;
    }

    saveSettings() {
        const settings = {
            workDuration: parseInt(document.getElementById('work-duration').value),
            shortBreakDuration: parseInt(document.getElementById('short-break-duration').value),
            longBreakDuration: parseInt(document.getElementById('long-break-duration').value),
            soundEnabled: document.getElementById('sound-enabled').checked,
            showTimeInTitle: document.getElementById('show-time-in-title').checked,
            soundType: document.getElementById('sound-type').value,
            soundVolume: parseFloat(document.getElementById('sound-volume').value)
        };

        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));

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