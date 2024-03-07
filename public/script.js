const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const titleInput = document.getElementById('titleInput');
const descriptionInput = document.getElementById('descriptionInput');

// Function to fetch tasks
async function fetchTasks() {
  try {
    const response = await axios.post('http://localhost:4002/graphql', {
      query: '{ tasks { _id, title, description, completed } }'
    });
    const { data } = response.data;
    displayTasks(data.tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

// Function to display tasks
function displayTasks(tasks) {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const taskItem = document.createElement('div');
    taskItem.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task._id}')">
      <strong>${task.title}</strong>
      <p>${task.description}</p>
      <button onclick="deleteTask('${task._id}')">Delete</button>
    `;
    taskList.appendChild(taskItem);
  });
}

// Event listener for form submission
taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = titleInput.value;
  const description = descriptionInput.value;
  if (title && description) {
    try {
      await axios.post('http://localhost:4002/graphql', {
        query: `mutation { createTask(input: { title: "${title}", description: "${description}" }) { _id } }`,
      });
      titleInput.value = '';
      descriptionInput.value = '';
      await fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
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
    await fetchTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
  }
}

// Initial fetch of tasks
fetchTasks();
