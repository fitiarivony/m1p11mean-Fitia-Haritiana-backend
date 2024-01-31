const Dog = require("../models");
const connection=require('../db');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get("/", async (req, res) => {
    connection.openConnection();
    let newDog = new Dog({
      name: 'Kelvin Mwinuka',
      breed: 'email@kelvinmwinuka.com',
      age: 20,
      isGoodBoy: false
    })
    // let savedDog = await newDog.save();
    const allDogs = await Dog.find()
    connection.closeConnection();
    return res.status(200).json(allDogs);
  });

module.exports = router;