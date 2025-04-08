/**
 * Timer functionality for the Pomodoro Timer
 */

// Timer states
const TIMER_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused'
};

// Timer modes
const TIMER_MODES = {
    WORK: 'work',
    SHORT_BREAK: 'shortBreak',
    LONG_BREAK: 'longBreak'
};

// Map modes to display names
const MODE_DISPLAY_NAMES = {
    [TIMER_MODES.WORK]: 'Trabalho',
    [TIMER_MODES.SHORT_BREAK]: 'Pausa Curta',
    [TIMER_MODES.LONG_BREAK]: 'Pausa Longa'
};

// Timer variables
let timerState = TIMER_STATES.IDLE;
let currentMode = TIMER_MODES.WORK;
let timeLeft = 0; // in seconds
let timerId = null;
let completedSessions = 0;
let audioContext = null;

// DOM elements
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const currentModeElement = document.getElementById('current-mode');
const sessionCountElement = document.getElementById('session-count');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const resetButton = document.getElementById('reset-btn');
const progressRing = document.getElementById('progress-ring-circle');

// Progress ring variables
let totalTime = 0;
const progressRingCircumference = 2 * Math.PI * 80; // 2πr where r=80

// Initialize timer
function initTimer() {
    // Set initial time based on work duration
    resetTimer();

    // Add event listeners to buttons
    startButton.addEventListener('click', startTimer);
    pauseButton.addEventListener('click', pauseTimer);
    resetButton.addEventListener('click', resetTimer);

    // Update UI
    updateTimerDisplay();
    updateModeDisplay();
    updateProgressRing(1); // Initial state: full ring
}

// Set timer duration based on current mode
function setTimerDuration() {
    switch (currentMode) {
        case TIMER_MODES.WORK:
            timeLeft = settings.workDuration * 60;
            break;
        case TIMER_MODES.SHORT_BREAK:
            timeLeft = settings.shortBreakDuration * 60;
            break;
        case TIMER_MODES.LONG_BREAK:
            timeLeft = settings.longBreakDuration * 60;
            break;
    }
    totalTime = timeLeft;
}

// Start timer
function startTimer() {
    if (timerState === TIMER_STATES.RUNNING) return;

    timerState = TIMER_STATES.RUNNING;

    // Track timer start event if trackEvent function exists
    if (typeof trackEvent === 'function') {
        trackEvent('Timer', 'Start', currentMode);
    }

    // Clear any existing timer
    if (timerId) {
        clearInterval(timerId);
    }

    // Start new timer
    const startTime = Date.now();
    const initialTimeLeft = timeLeft;

    timerId = setInterval(() => {
        // Calculate elapsed time precisely to avoid drift
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timeLeft = initialTimeLeft - elapsed;

        if (timeLeft <= 0) {
            timeLeft = 0;
            clearInterval(timerId);
            timerComplete();
        }

        updateTimerDisplay();
        updateProgressRing(timeLeft / totalTime);
    }, 500); // Update every half second for smoother display
}

// Pause timer
function pauseTimer() {
    if (timerState !== TIMER_STATES.RUNNING) return;

    timerState = TIMER_STATES.PAUSED;
    clearInterval(timerId);

    // Track timer pause event if trackEvent function exists
    if (typeof trackEvent === 'function') {
        trackEvent('Timer', 'Pause', currentMode);
    }
}

// Reset timer
function resetTimer() {
    timerState = TIMER_STATES.IDLE;
    if (timerId) {
        clearInterval(timerId);
    }

    // Track timer reset event if trackEvent function exists
    if (typeof trackEvent === 'function') {
        trackEvent('Timer', 'Reset', currentMode);
    }

    // Set duration based on current mode
    setTimerDuration();
    updateTimerDisplay();
    updateProgressRing(1); // Full ring on reset
}

// Timer complete
function timerComplete() {
    playNotificationSound();

    // Track timer complete event if trackEvent function exists
    if (typeof trackEvent === 'function') {
        trackEvent('Timer', 'Complete', currentMode);
    }

    if (currentMode === TIMER_MODES.WORK) {
        // Increment session count after work session
        completedSessions++;
        sessionCountElement.textContent = completedSessions;

        // Track session completion
        if (typeof trackEvent === 'function') {
            trackEvent('Session', 'Complete', `Session #${completedSessions}`);
        }

        // After 4 work sessions, take a long break
        if (completedSessions % 4 === 0) {
            currentMode = TIMER_MODES.LONG_BREAK;
        } else {
            currentMode = TIMER_MODES.SHORT_BREAK;
        }
    } else {
        // After any break, go back to work mode
        currentMode = TIMER_MODES.WORK;
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

    // Update page title
    document.title = `${minutes}:${seconds.toString().padStart(2, '0')} - Pomodoro Timer`;
}

// Update mode display
function updateModeDisplay() {
    currentModeElement.textContent = MODE_DISPLAY_NAMES[currentMode];
}

// Play notification sound
function playNotificationSound() {
    if (!settings.soundEnabled) return;

    try {
        // Lazy initialize AudioContext to avoid autoplay restrictions
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Create oscillator
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Set sound parameters
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;

        // Schedule the beeps
        const now = audioContext.currentTime;
        oscillator.start(now);
        oscillator.stop(now + 0.8);

        // Beep pattern: on-off-on-off-on
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.setValueAtTime(0, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now + 0.3);
        gainNode.gain.setValueAtTime(0, now + 0.5);
        gainNode.gain.setValueAtTime(0.1, now + 0.6);
        gainNode.gain.setValueAtTime(0, now + 0.8);
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
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

// Initialize timer when the page loads
document.addEventListener('DOMContentLoaded', function () {
    // Wait for settings to load first
    setTimeout(initTimer, 100);
}); 