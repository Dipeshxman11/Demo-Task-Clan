const { buildSchema } = require('graphql');

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


module.exports = { schema };