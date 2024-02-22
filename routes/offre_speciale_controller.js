const connection = require('../db')
var express = require('express')
var router = express.Router()
const OffreSpeciale = require('../models/offre_speciale')
const Client= require('../models/client')
const Mailer=require('../models/mailer')
router.get('/', async (req, res) => {
  connection.openConnection()
  return res.status(200).json(await OffreSpeciale.getAll())
})
router.get('/:id', async (req, res) => {
  connection.openConnection()
  let id = req.params.id
  let emp = await OffreSpeciale.findById(id)
  return res.status(200).json(emp)
})
router.post('/', async (req, res) => {
  connection.openConnection()
  let clientVises = req.body.clientVises
  let newOffre = new OffreSpeciale(req.body)
  newOffre.clientVises=[]
  newOffre.save()
  Client.updateMany(
    { _id: { $in: clientVises } },
    { $addToSet: { reduction: newOffre._id } },
  );
  // console.log(clientVises);
  
  const emails = await Client.find(
    { _id: { $in: clientVises } },
    { identifiant: 1, _id: 0 } // Project only the email field, exclude _id field
  );
  // console.log(emails);
  let mailsOnly=[]
  emails.map((email)=>mailsOnly.push(email.identifiant))
  // console.log(mailsOnly);
  Mailer.sendSpecialOffer(mailsOnly, newOffre.nomOffreSpeciale, newOffre.description)

  return res.status(200).json('Employé enregistré')
})
router.put('/:id_offre', async function (req, res) {
  try {
    await OffreSpeciale.findByIdAndUpdate(
      req.params.id_offre,
      { $set: req.body },
      { runValidators: true }
    )
    return res
      .status(200)
      .json(await OffreSpeciale.findById(req.params.id_offre))
  } catch (error) {
    res.status(500).json(error.message)
  }
})
router.delete('/:id_offre', async function (req, res) {
  try {
    await Service.findByIdAndDelete(req.params.id_offre)
    return res.status(200).json('deleted')
  } catch (error) {
    return res.status(500).json(error.message)
  }
})
module.exports = router
