
const connection = require("../db");
const crypto = require('crypto');
var express = require("express");
const Manager = require("../models/manager");
const Token = require("../models/token");
var router = express.Router();

router.use(async function (req, res, next) {
  if (req.body.mdp || req.query.mdp) {
    let password = req.body.mdp || req.query.mdp;
    try {
        const sha1Hash = crypto.createHash('sha1');
        sha1Hash.update(password);
        req.mdp_hash= sha1Hash.digest('hex');
    } catch (err) {
      return res.status(500).json({ error: err });
    }
  }
  next();
});

router.get("/", async (req, res) => {
  try {
    let manager = req.query;
    console.log(req.mdp_hash);
    const login = await Manager.findOne({
      identifiant: manager.identifiant,
      mdp: req.mdp_hash,
    },{__v:0});
    if(login){
      let daty=new Date();
      daty.setHours(daty.getHours()+1);
      const sha1Hash = crypto.createHash('sha1');
      sha1Hash.update(login._id+Date.now());
      let token=new Token({ date_expiration: daty,token:sha1Hash.digest('hex'),id_admin:login._id,statut:1 }) 
      await token.save();
      return res.status(200).json({code:true,admin:login,token:token});
    }
    return res.status(500).json({code:false});
  } catch (error) {
    console.log("Erreur");
    return res.status(500).json(error.message);
  }
});
module.exports = router;
