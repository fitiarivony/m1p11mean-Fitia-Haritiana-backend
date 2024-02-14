const dotenv = require('dotenv').config()
var express = require('express')
const bodyParser = require('body-parser')
const Rdv = require('./models/rdv')
const connection = require('./db')

var DogRouter = require('./routes/dogs')
var EmployeRouter = require('./routes/employeController')
var GenreRouter = require('./routes/GenreController')
var ManagerRouter = require('./routes/manager')
var ServicesRouter = require('./routes/service')
var ClientRouter = require('./routes/client')
var OffreRouter = require('./routes/offre_speciale_controller')
var RdvRouter = require('./routes/rdv')

var app = express()

app.use(bodyParser.json()) //Fanekena anle format JSON
app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*') // Autoriser toutes les origines (à ajuster en production)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, authorization')
  next()
})
app.use('/dogs', DogRouter)
app.use('/managers', ManagerRouter)
app.use('/emp', EmployeRouter)
app.use('/genre', GenreRouter)
app.use('/services', ServicesRouter)
app.use('/clients', ClientRouter)
app.use('/offres', OffreRouter)
app.use('/rdv', RdvRouter)

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port ' + process.env.PORT)
  connection.openConnection()
})
const schedule = require('node-schedule')

// Function to be executed every morning at 6 am
const dailyTask = () => {
  Rdv.remindRdv()
  // Place your repetitive task code here
}

// Schedule the task to run every morning at 6 am
const job = schedule.scheduleJob('0 6 * * *', dailyTask)

// Log a message when the script starts
console.log('Scheduled task started. Waiting for 6 am...')
