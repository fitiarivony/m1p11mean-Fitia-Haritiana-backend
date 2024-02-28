var express = require("express");
const Token = require("../models/token");
var mongoose = require("mongoose");
var router = express.Router();
router.delete("/logout/:id", async function (req, res) {
    let now=new Date()
  try {
    console.log(Token);
    await Token.deleteOne({
        token: req.headers.authorization,
      });
    await Token.deleteMany({
      id_admin: req.params.id,
      date_expiration: { $lt: now },
    });
    return res.status(200).json(true);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});
module.exports = router;
