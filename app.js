const dotenv = require('dotenv').config();
var express = require("express");
const connection = require("./db");

const bodyParser = require("body-parser");
var cors = require('cors')
var DogRouter = require('./routes/dogs');
var ManagerRouter = require('./routes/manager');
// var ServicesRouter=require('./routes/service');
var app = express();
app.use(cors());
app.use(bodyParser.json()); //Fanekena anle format JSON
app.use(express.json());

app.use('/dogs', DogRouter);
app.use('/managers', ManagerRouter);
// app.use('/services', ServicesRouter);

app.listen(process.env.PORT, function () {
  console.log("Example app listening on port "+process.env.PORT);
  connection.openConnection();
});