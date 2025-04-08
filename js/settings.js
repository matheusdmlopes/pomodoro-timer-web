/**
 * Settings management for the Pomodoro Timer
 */

// Default settings
const DEFAULT_SETTINGS = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    soundEnabled: true
};

// Settings object to store current settings
const settings = {
    ...DEFAULT_SETTINGS
};

// Load settings from localStorage if available
function loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            Object.assign(settings, parsedSettings);
            updateSettingsForm();
        } catch (error) {
            console.error('Error loading settings:', error);
            // If there's an error, use defaults and clear localStorage
            localStorage.removeItem('pomodoroSettings');
        }
    }
}

// Save settings to localStorage
function saveSettings() {
    try {
        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Update the settings form with current values
function updateSettingsForm() {
    document.getElementById('work-duration').value = settings.workDuration;
    document.getElementById('short-break-duration').value = settings.shortBreakDuration;
    document.getElementById('long-break-duration').value = settings.longBreakDuration;
    document.getElementById('sound-enabled').checked = settings.soundEnabled;
}

// Initialize settings form
function initSettingsForm() {
    const settingsForm = document.getElementById('settings-form');

    // Update settings form with current values
    updateSettingsForm();

    // Add submit event listener to the form
    settingsForm.addEventListener('submit', function (event) {
        event.preventDefault();

        // Get form values
        const workDuration = parseInt(document.getElementById('work-duration').value);
        const shortBreakDuration = parseInt(document.getElementById('short-break-duration').value);
        const longBreakDuration = parseInt(document.getElementById('long-break-duration').value);
        const soundEnabled = document.getElementById('sound-enabled').checked;

        // Validate input
        if (workDuration < 1 || shortBreakDuration < 1 || longBreakDuration < 1) {
            alert('As durações devem ser de pelo menos 1 minuto');
            return;
        }

        // Track settings changes if trackEvent function exists
        if (typeof trackEvent === 'function') {
            if (settings.workDuration !== workDuration) {
                trackEvent('Settings', 'Change', `Work Duration: ${workDuration}min`);
            }
            if (settings.shortBreakDuration !== shortBreakDuration) {
                trackEvent('Settings', 'Change', `Short Break: ${shortBreakDuration}min`);
            }
            if (settings.longBreakDuration !== longBreakDuration) {
                trackEvent('Settings', 'Change', `Long Break: ${longBreakDuration}min`);
            }
            if (settings.soundEnabled !== soundEnabled) {
                trackEvent('Settings', 'Change', `Sound: ${soundEnabled ? 'Enabled' : 'Disabled'}`);
            }
        }

        // Update settings
        settings.workDuration = workDuration;
        settings.shortBreakDuration = shortBreakDuration;
        settings.longBreakDuration = longBreakDuration;
        settings.soundEnabled = soundEnabled;

        // Save settings
        saveSettings();

        // Reset timer with new settings if needed
        if (typeof resetTimer === 'function') {
            resetTimer();
        }

        alert('Configurações salvas com sucesso!');
    });
}

// Load settings when the page loads
document.addEventListener('DOMContentLoaded', function () {
    loadSettings();
    initSettingsForm();
}); 