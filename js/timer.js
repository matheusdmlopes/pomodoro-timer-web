/**
 * Timer functionality for the Pomodoro Timer
 */

// Timer modes
const TIMER_MODES = {
    POMODORO: 'pomodoro',
    SHORT_BREAK: 'short-break',
    LONG_BREAK: 'long-break'
};

// Map modes to display names
const MODE_DISPLAY_NAMES = {
    [TIMER_MODES.POMODORO]: 'Pomodoro',
    [TIMER_MODES.SHORT_BREAK]: 'Pausa Curta',
    [TIMER_MODES.LONG_BREAK]: 'Pausa Longa'
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
    resetTimer(); // This will set the initial time based on current mode
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    }

    // Set initial time based on current mode
    timeLeft = settings.workDuration * 60;
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
}

// Switch timer mode
function switchMode(mode) {
    if (mode === currentMode) return;

    // Update active button
    modeButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.mode === mode);
    });

    // Always reload the latest settings from localStorage
    loadSettings();

    currentMode = mode;

    // Set time based on mode
    switch (mode) {
        case TIMER_MODES.POMODORO:
            timeLeft = settings.workDuration * 60;
            break;
        case TIMER_MODES.SHORT_BREAK:
            timeLeft = settings.shortBreakDuration * 60;
            break;
        case TIMER_MODES.LONG_BREAK:
            timeLeft = settings.longBreakDuration * 60;
            break;
    }

    updateTimerDisplay();
    updateModeDisplay();

    // Track event
    trackEvent('Timer', 'Switch Mode', mode);
}

// Start timer
function startTimer() {
    if (isRunning) return;

    isRunning = true;
    timerId = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerId);
            isRunning = false;
            playNotificationSound();
            handleTimerComplete();
        }
    }, 1000);

    // Track event
    trackEvent('Timer', 'Start', currentMode);
}

// Pause timer
function pauseTimer() {
    if (!isRunning) return;

    clearInterval(timerId);
    isRunning = false;

    // Track event
    trackEvent('Timer', 'Pause', currentMode);
}

// Reset timer
function resetTimer() {
    clearInterval(timerId);
    isRunning = false;

    // Reload latest settings
    loadSettings();

    // Reset time based on current mode
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
    }

    updateTimerDisplay();

    // Track event
    trackEvent('Timer', 'Reset', currentMode);
}

// Handle timer completion
function handleTimerComplete() {
    if (currentMode === TIMER_MODES.POMODORO) {
        // Increment session count after work session
        completedSessions++;
        sessionCountElement.textContent = completedSessions;

        // Track session completion
        if (typeof trackEvent === 'function') {
            trackEvent('Session', 'Complete', `Session #${completedSessions}`);
        }

        // After 4 work sessions, take a long break
        if (completedSessions % 4 === 0) {
            switchMode(TIMER_MODES.LONG_BREAK);
        } else {
            switchMode(TIMER_MODES.SHORT_BREAK);
        }
    } else {
        // After any break, go back to work mode
        switchMode(TIMER_MODES.POMODORO);
    }

    // Update mode display
    updateModeDisplay();

    // Reset timer for the new mode
    resetTimer();

    // Auto-start the next session
    startTimer();
}

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');

    // Update page title only if enabled in settings
    if (settings.showTimeInTitle) {
        document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - Pomodoro Timer`;
    } else {
        document.title = 'Pomodoro Timer';
    }
}

// Update mode display
function updateModeDisplay() {
    currentModeElement.textContent = MODE_DISPLAY_NAMES[currentMode];
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

// Update settings
function updateSettings(newSettings) {
    settings = newSettings;
    updateTimerDisplay(); // Immediately update the display to reflect new settings
}

// Initialize timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initTimer();
    // Export timer functionality globally
    window.timer = {
        updateSettings
    };
}); 