/**
 * Timer functionality for the Pomodoro Timer
 */

// Timer modes
const TIMER_MODES = {
    POMODORO: 'pomodoro',
    SHORT_BREAK: 'short-break',
    LONG_BREAK: 'long-break'
};

// Map modes to i18n keys (used by updateModeDisplay)
// Display names are now handled by i18n.js
const MODE_I18N_KEYS = {
    [TIMER_MODES.POMODORO]: 'modePomodoro',
    [TIMER_MODES.SHORT_BREAK]: 'modeShortBreak',
    [TIMER_MODES.LONG_BREAK]: 'modeLongBreak'
};

// Sound manager to handle audio files
class SoundManager {
    constructor() {
        this.sounds = {};
        this.loadSounds();
    }

    loadSounds() {
        // Mapping of sound types to file paths
        const soundFiles = {
            'bell': 'assets/sounds/bell.mp3',
            'alarm': 'assets/sounds/alarm.mp3',
            'alarm_loud': 'assets/sounds/alarm_loud.mp3',
            // Fallback sound using bell for backward compatibility
            'beep': 'assets/sounds/bell.mp3',
            'notification': 'assets/sounds/bell.mp3'
        };

        // Pre-load sounds
        for (const [name, path] of Object.entries(soundFiles)) {
            this.sounds[name] = new Audio(path);
            // Preload the audio file
            this.sounds[name].load();
        }
    }

    play(soundType, volume = 0.75) {
        // Default to bell if sound type not found
        const sound = this.sounds[soundType] || this.sounds['bell'];
        if (!sound) return;

        // Set volume and reset playback position
        sound.volume = volume;
        sound.currentTime = 0;

        // Play the sound with error handling
        sound.play().catch(e => {
            console.error(`Error playing sound ${soundType}:`, e);
        });
    }
}

// Initialize sound manager
const soundManager = new SoundManager();

// Timer state
let timeLeft;
let isRunning = false;
let timerId = null;
let currentMode = TIMER_MODES.POMODORO;
let completedSessions = 0;
let audioContext = null;
let startTimestamp = null; // Timestamp when the timer started
let pausedTimeLeft = 0;    // Time left when paused
let settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    soundEnabled: true,
    showTimeInTitle: true,
    autoStartEnabled: false,
    soundType: 'bell',
    soundVolume: 0.5
};

// DOM elements
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const currentModeElement = document.getElementById('current-mode');
const sessionCountElement = document.getElementById('session-count');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const resetButton = document.getElementById('reset-btn');
const progressRing = document.getElementById('progress-ring-circle');
const modeButtons = document.querySelectorAll('.mode-btn');

// Progress ring variables
let totalTime = 0;
const progressRingCircumference = 2 * Math.PI * 80; // 2πr where r=80

// Sound configurations (kept for backward compatibility)
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

// Initialize timer
function initTimer() {
    loadSettings();
    setupEventListeners();
    resetTimer(); // This will set the initial time and mode display
    // Initial mode display update might rely on i18n loading, so we re-call it
    // after the initial language set in i18n.js
    document.addEventListener('languageChanged', () => updateModeDisplay());
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        // Merge saved settings with defaults to ensure all keys exist
        settings = { ...settings, ...JSON.parse(savedSettings) };
    }

    // Reset timer values based on loaded settings and current mode
    resetTimerValues();
}

// Separate function to reset timer values based on current mode and settings
function resetTimerValues() {
    switch (currentMode) {
        case TIMER_MODES.POMODORO:
            timeLeft = settings.workDuration * 60;
            break;
        case TIMER_MODES.SHORT_BREAK:
            timeLeft = settings.shortBreakDuration * 60;
            break;
        case TIMER_MODES.LONG_BREAK:
            timeLeft = settings.longBreakDuration * 60;
            break;
        default:
            // Fallback to pomodoro if mode is somehow invalid
            currentMode = TIMER_MODES.POMODORO;
            timeLeft = settings.workDuration * 60;
    }
    totalTime = timeLeft; // Update total time for progress ring (if used)
}

// Setup event listeners
function setupEventListeners() {
    startButton.addEventListener('click', startTimer);
    pauseButton.addEventListener('click', pauseTimer);
    resetButton.addEventListener('click', resetTimer);

    // Add event listeners for mode buttons
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!isRunning) {
                switchMode(button.dataset.mode);
            }
        });
    });

    // Listen for language changes to update dynamic texts
    document.addEventListener('languageChanged', (event) => {
        const langData = event.detail.langData;
        updateModeDisplay(); // Update mode display text
        // Update page title if needed
        if (!isRunning) {
            updatePageTitle();
        }
        // Potentially update other dynamic texts if needed here
    });

    // Listen for visibility change to update the timer when tab becomes visible again
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Handle visibility change
function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && isRunning) {
        // Update the timer immediately when the tab becomes visible
        updateTimer();
    }
}

// Switch timer mode
function switchMode(mode) {
    if (!TIMER_MODES[Object.keys(TIMER_MODES).find(key => TIMER_MODES[key] === mode)]) {
        console.warn(`Invalid mode attempted: ${mode}. Defaulting to POMODORO.`);
        mode = TIMER_MODES.POMODORO;
    }

    if (mode === currentMode) return;

    currentMode = mode;
    clearInterval(timerId);
    isRunning = false;
    startTimestamp = null;
    pausedTimeLeft = 0;

    // Update active button styling
    modeButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.mode === mode);
    });

    // Reset timer values for the new mode
    resetTimerValues();

    // Update displays
    updateTimerDisplay();
    updateModeDisplay();

    // Track event (optional)
    // trackEvent('Timer', 'Switch Mode', mode);
}

// Update timer based on timestamps
function updateTimer() {
    if (!isRunning || !startTimestamp) return;

    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTimestamp) / 1000);

    // Calculate the new time left
    const newTimeLeft = Math.max(0, pausedTimeLeft - elapsedSeconds);

    // Only update if the time has changed
    if (newTimeLeft !== timeLeft) {
        timeLeft = newTimeLeft;
        updateTimerDisplay();
        updatePageTitle();

        if (timeLeft <= 0) {
            clearInterval(timerId);
            isRunning = false;
            startTimestamp = null;
            pausedTimeLeft = 0;
            playNotificationSound();
            handleTimerComplete();
        }
    }
}

// Start timer
function startTimer() {
    if (isRunning) return;
    if (timeLeft <= 0) {
        resetTimerValues(); // Ensure time is reset if starting from 0
        updateTimerDisplay();
    }

    isRunning = true;

    // Store the current timestamp and time left
    startTimestamp = Date.now();
    pausedTimeLeft = timeLeft;

    // Start interval that updates based on actual time elapsed
    timerId = setInterval(updateTimer, 1000);

    // Initial update
    updateTimer();

    // Track event (optional)
    // trackEvent('Timer', 'Start', currentMode);
}

// Pause timer
function pauseTimer() {
    if (!isRunning) return;

    clearInterval(timerId);
    isRunning = false;

    // Store the remaining time when paused
    pausedTimeLeft = timeLeft;
    startTimestamp = null;

    updatePageTitle(); // Update title to base title when paused

    // Track event (optional)
    // trackEvent('Timer', 'Pause', currentMode);
}

// Reset timer
function resetTimer() {
    clearInterval(timerId);
    isRunning = false;
    startTimestamp = null;
    pausedTimeLeft = 0;

    // Reload latest settings (important if they changed)
    loadSettings(); // This also calls resetTimerValues()

    // Update displays
    updateTimerDisplay();
    updateModeDisplay(); // Ensure mode display is correct
    updatePageTitle();   // Reset title

    // Track event (optional)
    // trackEvent('Timer', 'Reset', currentMode);
}

// Handle timer completion
function handleTimerComplete() {
    if (currentMode === TIMER_MODES.POMODORO) {
        completedSessions++;
        sessionCountElement.textContent = completedSessions; // Session count isn't translated

        // Track session completion (optional)
        // if (typeof trackEvent === 'function') {
        //     trackEvent('Session', 'Complete', `Session #${completedSessions}`);
        // }

        if (completedSessions % 4 === 0) {
            switchMode(TIMER_MODES.LONG_BREAK);
        } else {
            switchMode(TIMER_MODES.SHORT_BREAK);
        }
    } else {
        switchMode(TIMER_MODES.POMODORO);
    }

    // Auto-start the next session if enabled in settings
    if (settings.autoStartEnabled) {
        startTimer();
    }
}

// Update timer display (numbers)
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
    // Title update is handled separately in updatePageTitle
}

// Update mode display (text)
function updateModeDisplay() {
    const modeKey = MODE_I18N_KEYS[currentMode];
    // Use the getTranslation function from i18n.js
    currentModeElement.textContent = typeof getTranslation === 'function' ? getTranslation(modeKey) : modeKey;
}

// Update page title based on state and settings
function updatePageTitle() {
    const baseTitle = typeof getTranslation === 'function' ? getTranslation('appTitle') : 'Pomodoro Timer';
    if (settings.showTimeInTitle && isRunning && timeLeft >= 0) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - ${baseTitle}`;
    } else {
        document.title = baseTitle;
    }
}

// Play notification sound
function playNotificationSound(tempSettings) {
    // Use temporary settings if provided, otherwise use current settings
    const currentSettings = tempSettings || settings;

    if (!currentSettings.soundEnabled) return;

    // Use the sound manager to play the sound
    soundManager.play(currentSettings.soundType, currentSettings.soundVolume);
}

// Update progress ring
function updateProgressRing(progressFraction) {
    // Ensure the fraction is between 0 and 1
    progressFraction = Math.max(0, Math.min(1, progressFraction));

    // Calculate the offset (0 = empty circle, circumference = full circle)
    const offset = progressRingCircumference * (1 - progressFraction);

    // Update the stroke-dashoffset property
    if (progressRing) {
        progressRing.style.strokeDasharray = progressRingCircumference;
        progressRing.style.strokeDashoffset = offset;
    }
}

// Update settings (called from settings.js)
function updateSettings(newSettings) {
    // Ensure we preserve autoStartEnabled when updating from settings
    settings = { ...settings, ...newSettings };
    // If the timer is not running, update the display immediately
    if (!isRunning) {
        resetTimerValues();
        updateTimerDisplay();
        updatePageTitle(); // Update title in case showTimeInTitle changed
    }
}

// Initialize the timer when the script loads
initTimer();

// Expose timer functions and properties to global scope
window.timer = {
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
    switchMode: switchMode,
    updateSettings: updateSettings,
    playSound: function (tempSettings) {
        playNotificationSound(tempSettings);
    } // Expose sound function for test button
}; 