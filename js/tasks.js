// Task management functionality
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('pomodoroTasks')) || [];
        this.taskForm = document.getElementById('task-form');
        this.taskInput = document.getElementById('task-input');
        this.taskList = document.getElementById('task-list');

        this.initializeEventListeners();
        this.renderTasks();
    }

    initializeEventListeners() {
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask(this.taskInput.value);
            this.taskInput.value = '';
        });
    }

    addTask(text) {
        const task = {
            id: Date.now(),
            text,
            completed: false,
            pomodoros: 0
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();

        // Track event
        trackEvent('Tasks', 'Add', text);
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();

            // Track event
            trackEvent('Tasks', task.completed ? 'Complete' : 'Uncomplete', task.text);
        }
    }

    deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();

            // Track event
            trackEvent('Tasks', 'Delete', task.text);
        }
    }

    incrementPomodoros(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.pomodoros++;
            this.saveTasks();
            this.renderTasks();

            // Track event
            trackEvent('Tasks', 'Increment Pomodoros', `${task.text} (${task.pomodoros})`);
        }
    }

    saveTasks() {
        localStorage.setItem('pomodoroTasks', JSON.stringify(this.tasks));
    }

    renderTasks() {
        this.taskList.innerHTML = '';

        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';

            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" 
                           ${task.completed ? 'checked' : ''}>
                    <span class="task-text ${task.completed ? 'completed' : ''}">
                        ${task.text}
                    </span>
                    <span class="task-pomodoros">${task.pomodoros} 🍅</span>
                </div>
                <div class="task-actions">
                    <button onclick="taskManager.incrementPomodoros(${task.id})">+🍅</button>
                    <button onclick="taskManager.deleteTask(${task.id})">🗑️</button>
                </div>
            `;

            li.querySelector('.task-checkbox').addEventListener('change', () => {
                this.toggleTask(task.id);
            });

            this.taskList.appendChild(li);
        });
    }
}

// Initialize task manager when the page loads
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
}); 