var express = require("express");
const Token = require("../models/token");
var mongoose = require("mongoose");
var router = express.Router();
router.delete("/logout/:id", async function (req, res) {
    let now=new Date()
  try {
    let token_hash=req.headers.authorization.split(' ')[1];
    await Token.deleteOne({
        token: token_hash,
      });
    await Token.deleteMany({
      date_expiration: { $lt: now },
    });
    return res.status(200).json(true);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});
module.exports = router;
