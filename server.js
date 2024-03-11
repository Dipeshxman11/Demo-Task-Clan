const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const bodyParser = require('body-parser');
const path = require("path")
const fs = require("fs");
const morgan = require("morgan");

const mongoose = require('mongoose');
const { schema } = require('./graphql/schema');
const { root } = require('./graphql/resolvers');
const cors = require("cors");
require('./rabbitmq');
const dotenv = require("dotenv");
dotenv.config();


const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);




// Create Express server
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(morgan("combined", { stream: accessLogStream }));


// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));


// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));


// Connect to MongoDB
mongoose.connect(process.env.MONGODB);
const db = mongoose.connection;
db.once('open', () => {
  console.log('MongoDB connected');
});


// Start the server
app.listen(4002, () => {
  console.log(`Server running on port ${4002}`);
});
