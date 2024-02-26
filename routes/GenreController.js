const connection = require('../db')
var express = require('express')
var router = express.Router()
const Genre = require('../models/genre')
router.get('/', async (req, res) => {
  return res.status(200).json(await Genre.getAll())
})
module.exports = router
