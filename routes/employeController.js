const models = require('../models')
const connection = require('../db')
var express = require('express')
var router = express.Router()

/* GET home page. */

router.post('/login', async (req, res) => {
  console.log('niditra')
  connection.openConnection()
  let tempEmp = new models.Employe({
    identifiant: req.body.identifiant,
    mdp: req.body.mdp
  })
  try {
    const result = await tempEmp.login()
    return res.status(200).json(result)
  } catch (error) {
    if (error.message === 'Login erroné') {
      return res.status(500).json("Login erroné")
    } else if (error.message === 'Mot de passe éronné') {
      return res.status(500).json("Mot de passe éronné")
    } else {
      console.log("other");
    }
  }
})
module.exports = router
