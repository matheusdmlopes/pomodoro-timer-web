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

// Timer state
let timeLeft;
let isRunning = false;
let timerId = null;
let currentMode = TIMER_MODES.POMODORO;
let completedSessions = 0;
let audioContext = null;
let settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    soundEnabled: true,
    showTimeInTitle: true,
    soundType: 'beep',
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

// Sound configurations
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

// Start timer
function startTimer() {
    if (isRunning) return;
    if (timeLeft <= 0) {
        resetTimerValues(); // Ensure time is reset if starting from 0
        updateTimerDisplay();
    }

    isRunning = true;
    timerId = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        updatePageTitle(); // Continuously update title while running

        if (timeLeft <= 0) {
            clearInterval(timerId);
            isRunning = false;
            playNotificationSound();
            handleTimerComplete();
        }
    }, 1000);

    // Track event (optional)
    // trackEvent('Timer', 'Start', currentMode);
}

// Pause timer
function pauseTimer() {
    if (!isRunning) return;

    clearInterval(timerId);
    isRunning = false;
    updatePageTitle(); // Update title to base title when paused

    // Track event (optional)
    // trackEvent('Timer', 'Pause', currentMode);
}

// Reset timer
function resetTimer() {
    clearInterval(timerId);
    isRunning = false;

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

    // No need to call resetTimer here, switchMode handles it
    // Auto-start the next session if desired (could be a setting)
    // startTimer();
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
function playNotificationSound() {
    if (!settings.soundEnabled) return;

    // Create audio context on first use (to comply with autoplay policies)
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const soundConfig = SOUND_CONFIGS[settings.soundType];
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

// Export timer functionality globally
window.timer = {
    updateSettings
}; 