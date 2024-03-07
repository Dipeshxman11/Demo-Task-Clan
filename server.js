const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Task = require("./models/task")
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const cors = require('cors'); 
const path = require('path'); // Require the 'path' module

// Connect to MongoDB
mongoose.connect('mongodb+srv://dipesh19971102:0987654321@cluster0.vsbz19n.mongodb.net/IdeaClan', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

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
      const task = new Task({ ...input, completed: false });
      await task.save();
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
    return task;
  },
  deleteTask: async ({ id }) => {
    await Task.findByIdAndDelete(id);
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
