const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Task = require("./models/task")
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const cors = require('cors'); 
const path = require('path'); 
const amqp = require('amqplib/callback_api');

// Connect to MongoDB
mongoose.connect('mongodb+srv://dipesh19971102:0987654321@cluster0.vsbz19n.mongodb.net/IdeaClan', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
  process.exit(1); // Exit the process with error code 1
});

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
        const { action, id, task } = JSON.parse(msg.content.toString());
        switch (action) {
          case 'create':
            const newTask = new Task(task);
            await newTask.save();
            console.log('Task created:', newTask);
            break;
          case 'toggle':
            const existingTask = await Task.findById(id);
            if (!existingTask) {
              throw new Error('Task not found');
            }
            existingTask.completed = !existingTask.completed;
            await existingTask.save();
            console.log('Task toggled:', existingTask);
            break;
          case 'delete':
            await Task.findByIdAndDelete(id);
            console.log('Task deleted:', id);
            break;
          default:
            console.log('Unknown action:', action);
        }
        channel.ack(msg); // Acknowledge message
      } catch (error) {
        console.error('Error processing message:', error.message);
        channel.reject(msg, false); 
      }
    });
  });
});


// GraphQL schema
const schema = buildSchema(`
  type Task {
    _id: ID!
    title: String!
    description: String!
    completed: Boolean!
  }

  input TaskInput {
    title: String!
    description: String!
  }

  type Query {
    tasks: [Task]!
  }

  type Mutation {
    createTask(input: TaskInput): Task
    toggleTask(id: ID!): Task
    deleteTask(id: ID!): Boolean
  }
`);

// Root resolver
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
    const task = await Task.findById(id);
    task.completed = !task.completed;
    await task.save();

    // Publish a message to the 'tasks' queue
    console.log('Sending toggleTask message to RabbitMQ');
    channel.sendToQueue('tasks', Buffer.from(JSON.stringify({ action: 'toggle', id })));
    console.log('toggleTask message sent to RabbitMQ');

    return task;
  },
  deleteTask: async ({ id }) => {
    await Task.findByIdAndDelete(id);

    // Publish a message to the 'tasks' queue
    console.log('Sending deleteTask message to RabbitMQ');
    channel.sendToQueue('tasks', Buffer.from(JSON.stringify({ action: 'delete', id })));
    console.log('deleteTask message sent to RabbitMQ');

    return true;
  },
};

// Create Express server
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true,
}));

// Start the server
const PORT = 4002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
