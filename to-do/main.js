const taskList = document.getElementById('task-list');
let socket;

// Load tasks from local storage on page load
window.onload = () => {
    loadTasksFromLocalStorage();
    setupWebSocket();
};

function addTask() {
    const taskInput = document.getElementById('task-input');
    const deadlineInput = document.getElementById('deadline-input');

    if (taskInput.value === '') {
        alert("Please enter a task");
        return;
    }

    const taskItem = createTaskElement(taskInput.value, deadlineInput.value || 'No deadline');
    
    // Add task to the DOM and local storage
    taskList.appendChild(taskItem);
    saveTasksToLocalStorage();
    
    // Send task to WebSocket server
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: 'add', task: taskInput.value, deadline: deadlineInput.value || 'No deadline' }));
    }

    // Clear inputs
    taskInput.value = '';
    deadlineInput.value = '';
}

function createTaskElement(task, deadline) {
    const taskItem = document.createElement('li');
    taskItem.className = 'list-group-item d-flex justify-content-between align-items-center task-item';

    // Task name and deadline
    const taskText = document.createElement('span');
    taskText.innerHTML = `${task} <small class="deadline">(Deadline: ${deadline})</small>`;
    taskItem.appendChild(taskText);

    // Complete button
    const completeBtn = document.createElement('button');
    completeBtn.className = 'btn btn-success btn-sm';
    completeBtn.textContent = 'Complete';
    completeBtn.onclick = () => {
        taskItem.classList.add('task-complete');
        setTimeout(() => taskItem.remove(), 500);
        saveTasksToLocalStorage();

        // Notify server of task completion
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ action: 'complete', task: task }));
        }
    };
    taskItem.appendChild(completeBtn);

    // Add deadline as a data attribute for sorting later
    taskItem.setAttribute('data-deadline', deadline);

    return taskItem;
}

function sortTasks() {
    const tasks = Array.from(taskList.children);

    tasks.sort((a, b) => {
        const deadlineA = a.getAttribute('data-deadline');
        const deadlineB = b.getAttribute('data-deadline');

        return new Date(deadlineA) - new Date(deadlineB); // Sort in ascending order of dates
    });

    // Re-append the sorted tasks to the list
    tasks.forEach(task => taskList.appendChild(task));

    // Save the sorted order to local storage
    saveTasksToLocalStorage();
}

// Local Storage Functions
function saveTasksToLocalStorage() {
    const tasks = [];
    taskList.querySelectorAll('.task-item').forEach(taskItem => {
        const taskText = taskItem.querySelector('span').innerText;
        const deadline = taskItem.getAttribute('data-deadline');
        tasks.push({ task: taskText, deadline });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
    const savedTasks = JSON.parse(localStorage.getItem('tasks'));
    if (savedTasks) {
        savedTasks.forEach(task => {
            const taskItem = createTaskElement(task.task.split(" (Deadline: ")[0], task.deadline);
            taskList.appendChild(taskItem);
        });
    }
}

// WebSocket Functions
function setupWebSocket() {
    // Replace 'ws://localhost:8080' with your WebSocket server URL
    socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
        console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === 'add') {
            const taskItem = createTaskElement(data.task, data.deadline || 'No deadline');
            taskList.appendChild(taskItem);
            saveTasksToLocalStorage();
        } else if (data.action === 'complete') {
            completeTaskRemotely(data.task);
        }
    };

    socket.onclose = () => {
        console.log("WebSocket connection closed");
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };
}

function completeTaskRemotely(taskText) {
    const tasks = Array.from(taskList.children);
    const taskToComplete = tasks.find(taskItem => taskItem.querySelector('span').innerText.includes(taskText));
    if (taskToComplete) {
        taskToComplete.classList.add('task-complete');
        setTimeout(() => taskToComplete.remove(), 500);
        saveTasksToLocalStorage();
    }
}
