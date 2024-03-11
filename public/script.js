const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const titleInput = document.getElementById('titleInput');
const descriptionInput = document.getElementById('descriptionInput');




// Function to fetch tasks
async function fetchTasks() {
  try {
    console.log('Fetching tasks...');
    const response = await axios.post('http://localhost:4002/graphql', {
      query: '{ tasks { _id, title, description, completed } }'
    });
    const { data } = response.data;
    console.log('Fetched tasks:', data.tasks);
    displayTasks(data.tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}


// Function to display tasks
function displayTasks(tasks) {
  tasks.forEach(task => {
    // Check if task with the same ID already exists in the list
    if (!document.getElementById(task._id)) {
      const taskItem = document.createElement('div');
      taskItem.id = task._id; // Set the task ID as the element ID
      taskItem.innerHTML = 
      `<div class="task-item" id="${task._id}">
      <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task._id}')">  <span class="task-title">${task.title}</span>
  <span class="task-desc">${task.description}</span>
  <button onclick="deleteTask('${task._id}')">Delete</button>
</div>`
      taskList.appendChild(taskItem);
      
      // Focus on the newly added task
      taskList.scrollTop = taskList.scrollHeight;
    }
  });
}

// Function to create a new task
async function createTask(title, description) {
  try {

    await axios.post('http://localhost:4002/graphql', {
      query: `mutation { createTask(input: { title: "${title}", description: "${description}"}) { _id } }`,
    });
    await fetchTasks();
  } catch (error) {
    console.error('Error creating task:', error);
  }
}

// Event listener for form submission
taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = titleInput.value;
  const description = descriptionInput.value;
  if (title && description) {
    createTask(title, description);
    titleInput.value = '';
    descriptionInput.value = '';
  }
});

// Function to toggle task completion status
async function toggleTask(id) {
  try {
    await axios.post('http://localhost:4002/graphql', {
      query: `mutation { toggleTask(id: "${id}") { _id, completed } }`,
    });
    await fetchTasks();
  } catch (error) {
    console.error('Error toggling task status:', error);
  }
}

// Function to delete a task
async function deleteTask(id) {
  try {
    await axios.post('http://localhost:4002/graphql', {
      query: `mutation { deleteTask(id: "${id}") }`,
    });
    const taskElement = document.getElementById(id);
    if (taskElement) {
      taskElement.remove();
    }
  } catch (error) {
    console.error('Error deleting task:', error);
  }
}

// Initial fetch of tasks
fetchTasks();



