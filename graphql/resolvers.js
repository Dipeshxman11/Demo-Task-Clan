const Task = require("../models/task");

const root = {
  tasks: async () => {
    return await Task.find();
  },
  createTask: async ({ input }) => {
    try {
      const existingTask = await Task.findOne({ title: input.title, description: input.description });
      if (existingTask) {
        console.log('Task already exists:', existingTask);
        return existingTask;
      }
  
      const task = new Task({ ...input, completed: false });
      await task.save();
    
      // Publish a message to the 'tasks' queue
      console.log('Sending createTask message to RabbitMQ');
      channel.sendToQueue('tasks', Buffer.from(JSON.stringify({ action: 'create', task: { ...task.toObject(), _id: undefined } })));
      console.log('createTask message sent to RabbitMQ');
    
      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },
  
  
  toggleTask: async ({ id }) => {
    // const task = await Task.findById(id);
    // task.completed = !task.completed;
    // await task.save();

    // Publish a message to the 'tasks' queue
    console.log('Sending toggleTask message to RabbitMQ');
    channel.sendToQueue('tasks', Buffer.from(JSON.stringify({ action: 'toggle', id })));
    console.log('toggleTask message sent to RabbitMQ');

    return true;
  },
  deleteTask: async ({ id }) => {
    // await Task.findByIdAndDelete(id);

    // Publish a message to the 'tasks' queue
    console.log('Sending deleteTask message to RabbitMQ');
    channel.sendToQueue('tasks', Buffer.from(JSON.stringify({ action: 'delete', id })));
    console.log('deleteTask message sent to RabbitMQ');

    return true;
  },
};
module.exports = { root }
