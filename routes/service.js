const connection = require("../db");
var express = require("express");
const Service = require("../models/service_model");
const Manager = require("../models/manager");
const Token = require("../models/token");

var router = express.Router();

router.get("/", async (req, res) => {
  try {
    const services = await Service.find({},{__v:0});
    // connection.closeConnection();
    return res.status(200).json(services);
  } catch (error) {
    console.log("Erreur");
    // Gestion des erreurs
    return res.status(500).json(error.message);
  }
});

router.post('/',async (req, res) => {
    try {
      const token = new Token();
      await token.authenticate(req.headers.authorization, 1);
      const { _id, ...body } = req.body;
        console.log(body);
       let new_service=new Service(body);
       await  new_service.save();
       return res.status(200).json(new_service);
    } catch (error) {
        return res.status(500).json(error.message);
    }
})

router.put('/:id_service',async function (req, res) {
  try {
    const token = new Token();
      await token.authenticate(req.headers.authorization, 3);
    await Service.findByIdAndUpdate(req.params.id_service,{$set:req.body},{runValidators:true})
    return res.status(200).json({code:true })
  } catch (error) {
      res.status(500).json(error.message);
  }
});

router.delete('/:id_service',async function (req, res){
  try {
    const token = new Token();
      await token.authenticate(req.headers.authorization, 3);
    await Service.findByIdAndDelete(req.params.id_service)
    return res.status(200).json({code:true});
  } catch (error) {
    return res.status(500).json(error.message);
  }
}
);

router.get('/:id_service', async function(req, res) {
  try {
    const token = new Token();
      await token.authenticate(req.headers.authorization, 3);
    let service=await Service.findById(req.params.id_service);
    return res.status(200).json(service);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

module.exports = router;

