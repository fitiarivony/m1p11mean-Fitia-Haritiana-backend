const connection = require("../db");
var express = require("express");
const Depense = require("../models/depense");
const Manager = require("../models/manager");
const Token = require("../models/token");

var router = express.Router();

router.get("/", async (req, res) => {
  try {
    const depenses = await Depense.find({},{__v:0});
    // connection.closeConnection();
    return res.status(200).json(depenses);
  } catch (error) {
    // //console.log("Erreur");
    // Gestion des erreurs
    return res.status(500).json(error.message);
  }
});

router.post('/',async (req, res) => {
    try {
      const token = new Token();
      await token.authenticate(req.headers.authorization, 1);
      const { _id, ...body } = req.body;
        // //console.log(body);
       let new_depense=new Depense(body);
       await  new_depense.save();
       return res.status(200).json(new_depense);
    } catch (error) {
        return res.status(500).json(error.message);
    }
})

router.put('/:id_depense',async function (req, res) {
  try {
    const token = new Token();
      await token.authenticate(req.headers.authorization, 1);
    await Depense.findByIdAndUpdate(req.params.id_depense,{$set:req.body},{runValidators:true})
    return res.status(200).json({code:true })
  } catch (error) {
      res.status(500).json(error.message);
  }
});

router.delete('/:id_depense',async function (req, res){
  try {
    const token = new Token();
      await token.authenticate(req.headers.authorization, 1);
    await Depense.findByIdAndDelete(req.params.id_depense)
    return res.status(200).json({code:true});
  } catch (error) {
    return res.status(500).json(error.message);
  }
}
);

router.get('/:id_depense', async function(req, res) {
  try {
    const token = new Token();
      await token.authenticate(req.headers.authorization, 1);
    let depense=await Depense.findById(req.params.id_depense);
    return res.status(200).json(depense);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

module.exports = router;

