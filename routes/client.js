const crypto = require('crypto');
var express = require("express");
const client = require('../models/client');
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
  
router.post('/sign-up',async function(req, res){
    try {
      const { _id, ...user } = req.body;
        user.mdp=req.mdp_hash;
         let new_client=new client(user);
         await  new_client.save();
         return res.status(200).json(new_client);
      } catch (error) {
          return res.status(500).json(error.message);
      }

});
router.post('/sign-in',async (req, res) => {
  try {
    const { _id, ...user } = req.body;
      user.mdp=req.mdp_hash;
       let log_client=new client(user);
       let result=await  log_client.login();
       return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json(error.message);
    }
})
module.exports=router;
