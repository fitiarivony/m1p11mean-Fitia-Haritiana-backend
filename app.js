const dotenv = require('dotenv').config();
var express = require("express");

const bodyParser = require("body-parser");

var DogRouter = require('./routes/dogs');
var EmployeRouter=require('./routes/employeController');
var app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Autoriser toutes les origines (à ajuster en production)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use('/dogs', DogRouter);
app.use('/emp', EmployeRouter);

app.listen(process.env.PORT, function () {
  console.log("Example app listening on port "+process.env.PORT);
});