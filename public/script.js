const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const titleInput = document.getElementById('titleInput');
const descriptionInput = document.getElementById('descriptionInput');


async function fetchTasks() {
  try {
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


function displayTasks(tasks) {
  tasks.forEach(task => {
    if (!document.getElementById(task._id)) {
      const taskItem = document.createElement('div');
      taskItem.id = task._id;
      taskItem.innerHTML =
        `<div class="task-item" id="${task._id}">
      <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task._id}')">  <span class="task-title">${task.title}</span>
  <span class="task-desc">${task.description}</span>
  <button onclick="deleteTask('${task._id}')">Delete</button>
</div>`
      taskList.appendChild(taskItem);
      taskList.scrollTop = taskList.scrollHeight;
    }
  });
}

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

fetchTasks();



