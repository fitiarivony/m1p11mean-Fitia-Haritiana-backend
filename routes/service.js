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

router.use(async function(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).json({ error: 'No credentials sent!' });
  }
  let token_hash=req.headers.authorization.split(' ')[1];
  let now=new Date();
  let token= await Token.findOne({token: token_hash,date_expiration:{$gte:(now) }});
  console.log(token);
  if (!token)return res.status(403).json({ error: 'No credentials sent!' }); 
  next();
  
});


router.post('/',async (req, res) => {
    try {
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
    await Service.findByIdAndUpdate(req.params.id_service,{$set:req.body},{runValidators:true})
    return res.status(200).json({code:true })
  } catch (error) {
      res.status(500).json(error.message);
  }
});

router.delete('/:id_service',async function (req, res){
  try {
    await Service.findByIdAndDelete(req.params.id_service)
    return res.status(200).json({code:true});
  } catch (error) {
    return res.status(500).json(error.message);
  }
}
);

router.get('/:id_service', async function(req, res) {
  try {
    let service=await Service.findById(req.params.id_service);
    return res.status(200).json(service);
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

module.exports = router;

