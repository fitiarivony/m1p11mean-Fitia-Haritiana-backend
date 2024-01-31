const dotenv = require('dotenv').config();
var express = require("express");
const bodyParser = require("body-parser");

var DogRouter = require('./routes/dogs');

var app = express();
app.use(express.json());

app.use('/dogs', DogRouter);


app.listen(process.env.PORT, function () {
  console.log("Example app listening on port "+process.env.PORT);
});