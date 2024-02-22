const models = require("../models/models");
const connection = require("../db");
var express = require("express");
const Token = require("../models/token");
const rdv = require("../models/rdv");
const { default: mongoose } = require("mongoose");
var router = express.Router();

/* GET home page. */

router.post("/login", async (req, res) => {
  console.log("niditra");
  connection.openConnection();
  let tempEmp = new models.Employe({
    identifiant: req.body.identifiant,
    mdp: req.body.mdp,
  });
  try {
    const result = await tempEmp.login();
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Login erroné") {
      return res.status(500).json("Login erroné");
    } else if (error.message === "Mot de passe éronné") {
      return res.status(500).json("Mot de passe éronné");
    } else {
      console.log("other error");
      console.log(error);
    }
  }
});
router.get("/", async (req, res) => {
  connection.openConnection();
  return res.status(200).json(await models.Employe.getAll());
});
router.get("/favs", async (req, res) => {
  return res.status(200).json(["65bb5a74739acd602b1add49"]);
});

router.get("/names", async (req, res) => {
  connection.openConnection();
  return res
    .status(200)
    .json(await models.Employe.find({}).select("nom prenom").exec());
});

router.get("/:id", async (req, res) => {
  connection.openConnection();
  let id = req.params.id;
  let emp = await models.Employe.findById(id);
  return res.status(200).json(emp);
});
router.post("/", async (req, res) => {
  connection.openConnection();
  let tempEmp = new models.Employe({
    identifiant: req.body.identifiant,
    mdp: req.body.mdp,
    dateDeNaissance: req.body.dateDeNaissance,
    nom: req.body.nom,
    numeroCIN: req.body.numeroCIN,
    prenom: req.body.prenom,
    genre: req.body.genre,
  });
  tempEmp.save();
  console.log(tempEmp);

  return res.status(200).json("Employé enregistré");
});
router.put("/:id", async (req, res) => {
  connection.openConnection();
  let id = req.params.id;
  await models.Employe.findByIdAndUpdate(
    id,
    { $set: req.body },
    { runValidators: true }
  );
  let result = await models.Employe.findById(id);

  return res.status(200).json(result);
});
router.delete("/:id", async (req, res) => {
  connection.openConnection();
  let id = req.params.id;
  await models.Employe.findByIdAndDelete(id);

  return res.status(200).json("Employé enregistré");
});
router.post("/rdv/filtre", async function (req, res) {
  try {
    const token = new Token();
    let emp = await token.authenticate(req.headers.authorization, 2);
    let services = req.body.services.map(objet => new mongoose.Types.ObjectId(objet._id));
    let servicesStringId= req.body.services.map(objet => objet._id)
    let list_rdv = await rdv.filtre_rdv(
      req.body.datedebut,
      req.body.datefin,
      emp.id_admin,
      services
    );
   
    let valiny = await rdv.filtreRdvEmp(list_rdv, emp.id_admin,services, servicesStringId);
   
    let data = valiny.data;
    data.sort((a, b) => b.date_rdv - a.date_rdv);
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }
});

module.exports = router;
