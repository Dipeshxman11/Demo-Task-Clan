// rabbitmq.js
const amqp = require('amqplib/callback_api');
const Task = require("./models/task");

// Connect to RabbitMQ
amqp.connect('amqp://localhost', (error, connection) => {
  if (error) {
    console.error('Error connecting to RabbitMQ:', error);
    process.exit(1); // Exit the process with error code 1
    return;
  }

  connection.createChannel((error, ch) => {
    if (error) {
      console.error('Error creating channel:', error);
      process.exit(1); // Exit the process with error code 1
      return;
    }

    channel = ch;

    const queue = 'tasks';
    channel.assertQueue(queue, { durable: false });
    console.log('Connected to RabbitMQ');

    channel.consume('tasks', async (msg) => {
      try {
        const { action, id } = JSON.parse(msg.content.toString());
        switch (action) {
          case 'toggle':
            const taskToToggle = await Task.findById(id);
            if (!taskToToggle) {
              throw new Error('Task not found');
            }
            taskToToggle.completed = !taskToToggle.completed;
            await taskToToggle.save();
            console.log('Task toggled:', taskToToggle);
            break;
          case 'delete':
            await Task.findByIdAndDelete(id);
            console.log('Task deleted:', id);
            break;
          
        }
        channel.ack(msg); // Acknowledge message
      } catch (error) {
        console.error('Error processing message:', error.message);
        channel.reject(msg, false);
      }
    });
  });
});

