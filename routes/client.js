const crypto = require('crypto')
var express = require('express')
const client = require('../models/client')
var router = express.Router()
var Rdv = require('../models/rdv')
const Token = require('../models/token')

router.use(async function (req, res, next) {
  if (req.body.mdp || req.query.mdp) {
    let password = req.body.mdp || req.query.mdp
    try {
      const sha1Hash = crypto.createHash('sha1')
      sha1Hash.update(password)
      req.mdp_hash = sha1Hash.digest('hex')
    } catch (err) {
      return res.status(500).json({ error: err })
    }
  }
  next()
})

router.post('/sign-up', async function (req, res, next) {
  try {
    const { _id, ...user } = req.body
    user.mdp = req.mdp_hash
    let new_client = new client(user)
    await new_client.save()
    return res.status(200).json(new_client)
  } catch (error) {
    next(error)
  }
})
router.post('/sign-in', async (req, res) => {
  try {
    const { _id, ...user } = req.body
    user.mdp = req.mdp_hash
    let log_client = new client(user)
    let result = await log_client.login()
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json(error.message)
  }
})
router.get('/names', async (req, res) => {
  return res
    .status(200)
    .json(await client.find({}).select('nom_client prenom_client').exec())
})
router.get('/histo/:id', async (req, res) => {
  // // console.log("niditra");
  try {
    // console.log(Token);
    // // console.log("test");
    await Token.authenticate(req.headers.authorization, 3)
    let rdv = await Rdv.find({ id_client: req.params.id })
      .populate('rdv_service.id_service')
      .exec()
    // console.log(rdv)
    return res.status(200).json(rdv)
  } catch (error) {
    return res.status(500).json(error.message)
  }
})
router.get('/fav-emps/:id', async (req, res) => {
  try {
    await Token.authenticate(req.headers.authorization, 3)
    // // console.log(req.params.id);
    let cl = await client.findById(req.params.id).exec()
    return res.status(200).json(cl.fav_employe)
  } catch (error) {
    return res.status(500).json(error.message)
  }
})
router.post('/fav-emps/:id', async (req, res) => {
  try {
    await Token.authenticate(req.headers.authorization, 3)
    // // console.log(req.params.id);
    let cl = await client
      .findByIdAndUpdate(req.params.id, { $set: { fav_employe: req.body } })
      .exec()
    return res.status(200).json('Nety')
  } catch (error) {
    return res.status(500).json(error.message)
  }
})

router.get('/fav-serv/:id', async (req, res) => {
  try {
    await Token.authenticate(req.headers.authorization, 3)
    // // console.log(req.params.id);
    let cl = await client.findById(req.params.id).exec()
    return res.status(200).json(cl.fav_service)
  } catch (error) {
    return res.status(500).json(error.message)
  }
})
router.post('/fav-serv/:id', async (req, res) => {
  try {
    await Token.authenticate(req.headers.authorization, 3)
    // // console.log(req.params.id);
    let cl = await client
      .findByIdAndUpdate(req.params.id, { $set: { fav_service: req.body } })
      .exec()
    return res.status(200).json('Nety')
  } catch (error) {
    return res.status(500).json(error.message)
  }
})
router.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    let errorMessage = 'Erreur de validation : '
    for (let field in err.errors) {
      errorMessage += `${err.errors[field].message}, `
    }
    errorMessage = errorMessage.slice(0, -2) // Pour enlever la virgule et l'espace en trop
    return res.status(422).send(errorMessage)
  }
  next(err)
})

// Middleware pour gérer les erreurs non gérées
router.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send(err.error)
})
module.exports = router
