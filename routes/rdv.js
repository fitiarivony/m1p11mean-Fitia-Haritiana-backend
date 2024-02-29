const connection = require("../db");
var express = require("express");
const Token = require("../models/token");
const rdv = require("../models/rdv");
const Service = require("../models/service_model");
const Depense = require("../models/depense");
const client = require("../models/client");
const OffreSpeciale = require("../models/offre_speciale");
var router = express.Router();
const Employe = require("../models/models").Employe;

async function get_normalized_reduction(id_admin){
  let reduction_liste= JSON.parse(JSON.stringify(await client.getReductions(id_admin)))
  let liste_traite=[]
  reduction_liste.map((reduction)=>{
    liste_traite.push(reduction.offre)
    liste_traite[liste_traite.length-1].nombre=reduction.nombre
  })
  return liste_traite
}
function getValuesByField(arrayOfObjects, fieldName) {
  return arrayOfObjects.map(obj => obj[fieldName]);
}
function differ(arr1, arr2) {
  arr1=JSON.parse(JSON.stringify(arr1))
  arr2=JSON.parse(JSON.stringify(arr2))
  return arr1.filter(element => !arr2.includes(element));
}
function addInPax(apinaAnyAmPax, cl){
  apinaAnyAmPax.map((el)=>{
    let tao=false
    // // console.log(el.toString(), el2.offre.toString());
    cl.reduction.map((el2)=>{
      if(el.toString()===el2.offre.toString()){
        tao=true
        el2.nombre+=1
      }
    })
    if(!tao){
      // // console.log("tsy tao");
      cl.reduction.push({offre:el, nombre:1})
    }
  })
}
router.post("/", async function (req, res) {
  // console.log("tonga");
  try {
    const token = new Token();
    const log = await token.authenticate(req.headers.authorization, 3);
    let rendez_vous = req.body;
    rendez_vous.id_client = log.id_admin;
    // // console.log(rendez_vous);
    
    let new_rdv = new rdv(rendez_vous);
    console.log(new_rdv);
    await new_rdv.save_emp();

    let cl= await client.findById(rendez_vous.id_client)
    new_rdv.reduction.map((el)=>{
      cl.reduction.map((el2)=>{
        if(el.toString()==el2.offre.toString()){
          el2.nombre-=1
          if(el2.nombre==0)
            cl.reduction.splice(cl.reduction.indexOf(el2),1)
        }
      })
    })
    await client.updateOne({_id:rendez_vous.id_client},{reduction:cl.reduction})
    // // await new_rdv.save();
    return res.status(200).json("Coucou");
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }
});
router.get("/prise-rdv/:id", async function (req, res) {
  // // console.log("niditra prise rdv");
  try {
    let data = {
      employe: await rdv.getEmpPref(req.params.id),
      service: await rdv.getServicePref(req.params.id),
      reduction: await get_normalized_reduction(req.params.id),
    };

    return res.status(200).json(data);
  } catch (error) {
    // console.log(error);
    return res.status(500).json(error.message);
  }
});
router.get("/", async function (req, res) {
  try {
    const token = new Token();
    let emp = await token.authenticate(req.headers.authorization, 2);
    let list_rdv = await rdv.get(
      { "rdv_service.id_employe": emp.id_admin },
      { __v: 0 }
    );

    let valiny = await rdv.getRdvEmp(list_rdv, emp.id_admin);
    let data = valiny.data;
    data.sort((a, b) => b.date_rdv - a.date_rdv);
    let service= await Employe.findOne({
      _id:emp.id_admin,
    },{_v:0}).populate('services').exec();
    return res.status(200).json({donnee:data,service:service.services});
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

router.get("/avg", async function (req, res) {
  let valiny={
    avgrdv:await rdv.getAvgRdv(),
    tempsMoyen:await rdv.temps_moyen_travail(),
    beneficemois:await  rdv.benefice_mois(),
  }
  return res.status(200).json(valiny);
  
})

router.get("/today", async function (req, res) {
  try {
    const token = new Token();
    let emp = await token.authenticate(req.headers.authorization, 2);
    let today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    let endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );
    let list_rdv = await rdv.get({
      "rdv_service.id_employe": emp.id_admin,
      date_rdv: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });
    let data = await rdv.getRdvEmp(list_rdv, emp.id_admin);
    let valiny = data.data;
    valiny.sort((a, b) => -b.date_rdv + a.date_rdv);
    // // console.log(valiny);

    return res.status(200).json({ rdv: valiny, total: data.total });
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

// router.post("/dispo/:id",async function(req,res){
//   try {
//     let rendez_vous=new rdv();

//     let dispo=await rendez_vous.check_disponibilite(req.body.date,req.body.duree,req.params.id)
//     if (!dispo) {
//       return res.status(500).json("Mifanitsaka date");
//     }
//     return res.status(200).json(dispo)
//   } catch (error) {
//     console.error(error)
//     return res.status(500).json(error.message);
//   }
// })
router.post("/dispo", async function (req, res) {
  try {
    await rdv.check_dispo(req.body.rdv_service, undefined);
    return res.status(200).json(true);
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
});

router.post("/dispo/:id_rdv", async function (req, res) {
  try {
    await rdv.check_dispo(req.body.rdv_service, req.params.id_rdv);
    return res.status(200).json(true);
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
});

router.post("/suivi-tache", async function (req, res) {
  let body = req.body;
  try {
    await rdv.updateOne(
      {
        _id: body.id_rdv,
        "rdv_service.id_employe": body.id_employe,
        "rdv_service.id_service": body.id_service,
      },
      { $set: { "rdv_service.$.is_done": body.value } }
    );
    return res.status(200).json(true);
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
});
router.delete("/:id_rdv", async function (req, res) {
  try {
    const token = new Token();
    let admin = await token.authenticate(req.headers.authorization, 3);

    let rdv_to_delete=await rdv.findById(req.params.id_rdv).exec()
    let apinaAnyAmPax=rdv_to_delete.reduction
    let cl= await client.findById(admin.id_admin).exec()
    addInPax(apinaAnyAmPax, cl)
    await rdv.findOneAndDelete({
      _id: req.params.id_rdv,
      id_client: admin.id_admin,
    });
   
    return res.status(200).json(true);
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
});
router.get("/:id_rdv", async function (req, res) {
  try {
    const token = new Token();
    let cl = await token.authenticate(req.headers.authorization, 3);
    let rendezvous = await rdv.findById(req.params.id_rdv);
    // reduction possédé normalement
    let normalized_reduction=await get_normalized_reduction(cl.id_admin)

    // reduction dans le formulaire
    let alreadyAo=getValuesByField(normalized_reduction, '_id')
    let anapiana=rendezvous.reduction
    let toAdd=differ(anapiana, alreadyAo)
    toAdd=(await OffreSpeciale.getSpecialOffersByIds(toAdd))
    toAdd.map((el)=>{el.nombre=1})
    normalized_reduction=normalized_reduction.concat(toAdd)

    // response
    let data = {
      employe: await rdv.getEmpPref(cl.id_admin),
      service: await rdv.getServicePref(cl.id_admin),
      reduction: normalized_reduction,
      rdv: rendezvous,
    };

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error.message);
  }
});
router.put("/:id_rdv", async function (req, res) {
  try {
    const token = new Token();
    const admin = await token.authenticate(req.headers.authorization, 3);
    let rendez_vous = req.body;
    if (
      rendez_vous.id_client !== admin.id_admin &&
      rendez_vous.id_rdv !== req.params.id_rdv
    )
      return res.status(500).json("You're not allowed to do this action");
    //recupération ancienne réduction
    let old_rdv_reduc = await rdv.findById(req.params.id_rdv).select("reduction").exec();
    let new_rdv = new rdv(rendez_vous);
    console.log(rendez_vous);
    console.log(new_rdv);


    // await new_rdv.update_emp(req.params.id_rdv);
    // //Nouvelle réduction
    // let new_rdv_reduc = new_rdv.reduction
    // let apinaAnyAmPax=differ(old_rdv_reduc.reduction, new_rdv_reduc)
    // let alanaAnyAmPax=differ(new_rdv_reduc, old_rdv_reduc.reduction)

    // // console.log("---pax update---", apinaAnyAmPax, alanaAnyAmPax);
    // let cl= await client.findById(new_rdv.id_client)
    // alanaAnyAmPax.map((el)=>{
    //   cl.reduction.map((el2)=>{
    //     if(el.toString()==el2.offre.toString()){
    //       el2.nombre-=1
    //       if(el2.nombre==0)
    //         cl.reduction.splice(cl.reduction.indexOf(el2),1)
    //     }
    //   })
    // })
    // addInPax(apinaAnyAmPax, cl)
    // await client.updateOne({_id:rendez_vous.id_client},{reduction:cl.reduction})

    return res.status(200).json("Coucou");
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }
});

router.put("/payer/:id_rdv", async function (req, res) {
  // console.log("Payer");
  try {
    const token = new Token();
    await token.authenticate(req.headers.authorization, 3);
    let vaovao = await rdv.findByIdAndUpdate(
      req.params.id_rdv,
      { $set: { paye: true } },
      { new: true }
    );
    // console.log(vaovao);
    return res.status(200).json(vaovao);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error.message);
  }
});

router.get("/emp/temps-moyen", function (req, res) {
  // Exemple d'utilisation
  // console.log("Tonga ato");
  rdv
    .temps_moyen_travail()
    .then((tempsMoyenTravail) => {
      // console.log("Temps moyen de travail par employé :", tempsMoyenTravail);
      return res.status(200).json(tempsMoyenTravail);
    })
    .catch((err) => {
      return res.status(500).json(err);
      console.error("Erreur :", err);
    });
});

router.get("/benefice/mois",  async (req, res) => {
  try {
    let bilan= await rdv.benefice_mois();
    return res.status(200).json(bilan);
  } catch (error) {
    return res.status(500).json(error);
  }
});

module.exports = router;
