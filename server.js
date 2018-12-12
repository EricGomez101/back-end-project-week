// import all required modules
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
let port = process.env.PORT || 5000;
const server = express();
const userRoute = require('./Routes/user');
const notesRoute = require('./Routes/notesRoute');
const mediaRoute = require('./Routes/mediaRoute');


// database connection
mongoose.connect('mongodb://eric:x@ds139950.mlab.com:39950/lambda-notes')
  .then(() => {
    console.log('connected to database!');
  })
  .catch(err => {
    console.log(err);
  })

// mount middleware
server.use(cors({}))
server.use(helmet());
server.use(express.json());

// sanitation check
server.get('/', (req, res) => {
  res.json({status: 'connected'})
})

// server routes
server.use('/api/user', userRoute);
server.use('/api/notes', notesRoute);
server.use('/api/media', mediaRoute);

//port listener
server.listen(port , () => {
  console.log(`server listening on port ${port}`);
})
