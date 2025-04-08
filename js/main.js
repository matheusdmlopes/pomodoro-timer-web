/**
 * Main entry point for the Pomodoro Timer app
 */

// Global timer state for persistence
let timerStateData = {
    currentMode: null,
    timeLeft: null,
    isRunning: false,
    completedSessions: 0
};

// Save timer state to localStorage
function saveTimerState() {
    // Only save state if the timer has been initialized
    if (typeof currentMode !== 'undefined') {
        timerStateData = {
            currentMode,
            timeLeft,
            isRunning: timerState === TIMER_STATES.RUNNING,
            completedSessions
        };

        try {
            localStorage.setItem('pomodoroTimerState', JSON.stringify(timerStateData));
        } catch (error) {
            console.error('Error saving timer state:', error);
        }
    }
}

// Load timer state from localStorage
function loadTimerState() {
    const savedState = localStorage.getItem('pomodoroTimerState');
    if (savedState) {
        try {
            return JSON.parse(savedState);
        } catch (error) {
            console.error('Error loading timer state:', error);
            localStorage.removeItem('pomodoroTimerState');
        }
    }
    return null;
}

// Initialize app
function initApp() {
    // Initialize Service Worker for future PWA support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('./service-worker.js')
                .then(function (registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(function (error) {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }

    // Set up event listeners for beforeunload to save state
    window.addEventListener('beforeunload', saveTimerState);

    // Load saved timer state if it exists (will be used in timer.js)
    const savedState = loadTimerState();
    if (savedState) {
        // Global variables that will be accessed by timer.js
        window.savedTimerState = savedState;
    }
}

// Call init function when the page loads
document.addEventListener('DOMContentLoaded', initApp);

// Create a simple favicon in the absence of an image
function createFavicon() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext('2d');

    // Draw a circle
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();

    // Draw a center dot
    ctx.beginPath();
    ctx.arc(16, 16, 2, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Draw a hand
    ctx.beginPath();
    ctx.moveTo(16, 16);
    ctx.lineTo(16, 6);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Convert to data URL and set as favicon
    const faviconUrl = canvas.toDataURL('image/png');
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    document.head.appendChild(link);
}

// Create a favicon when the page loads
document.addEventListener('DOMContentLoaded', createFavicon); 