const mongoose = require("mongoose");
const Service = require("./service_model");
const client = require("./client");
const { Employe } = require("./models");

const rdvSchema = mongoose.Schema(
  {
    id_client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client",
      required: true,
    },
    date_rdv: {
      type: Date,
      required: true,
    },
    rdv_service: [
      {
        id_employe: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employe",
          required: true,
        },
        id_service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        ordre: {
          type: Number,
          required: true,
        },
        datedebut: {
          type: Date,
          required: true,
        },
        datefin: {
          type: Date,
          required: true,
        },
        is_done:{
          type: Boolean,
          required: true,
          default: false,
        },
        prix:{
          type:Number,
          required: true,
        }
      },
    ],
  },
  { collection: "rdv" }
);
rdvSchema.statics.get = function (conditions, colonnes) {
  return this.find(conditions, colonnes)
    .populate("id_client")
    .populate("rdv_service.id_employe")
    .populate("rdv_service.id_service")
    .exec();
};
rdvSchema.statics.getRdvEmp = async function (list_rdv, id_employe) {
  let data = await Service.find();
  let newData = [];
  console.log("Emp=", id_employe);
  let total=0;
  for (let rdv of list_rdv) {
    let date_rdv = rdv.date_rdv;
    let rdv_du = [];
    for (let rdv_service of rdv.rdv_service) {
      let essai = {};
      essai ={... rdv_service.toObject()};
      let service = data.filter(
        (service) =>
          service._id.toString() == rdv_service.id_service._id.toString()
      )[0];

      if (rdv_service.id_employe._id.toString() == id_employe.toString()) {
        essai.id_rdv = rdv._id;
        essai.date_rdv = new Date(date_rdv);
        essai.id_client = rdv.id_client;
        newData.push(essai);
        if(rdv_service.is_done)total+=essai.prix*(service.comission/100)
      }
      
      date_rdv.setMinutes(date_rdv.getMinutes() + service.duree);
      
      console.log("Minutes to add", service.duree, "=" + date_rdv);
    }
    // newData.push(rdv_du);
  }
  console.log("Total=",total)
  newData.sort((a, b) => b.date_rdv - a.date_rdv);
  return {data:newData,total:total};
};
rdvSchema.statics.check_dispo=async function (rdv_services) {
  let rdv_model = mongoose.model("rdv", rdvSchema);
  for (const rdv_service of rdv_services) {
    let rdv_daty = await rdv_model.find({
      "rdv_service.id_employe": rdv_service.id_employe,
      "rdv_service.datedebut": {
        $lt: rdv_service.datefin,
      },
      "rdv_service.datefin": {
        $gt: rdv_service.datedebut,
      },
    });
    console.log(rdv_daty);
    if (rdv_daty.length!=0)throw new Error("Mifanitsaka date");
  }
  
}

rdvSchema.methods = {
  save_emp: async function () {
    let services = await Service.find();
    let emps = await Employe.find();
    await this.check_horaire(emps, services)
    await this.save(); 
    
  },
  check_horaire:async function ( emps, services) {
    console.log("Check horaire");
    let date = new Date(this.date_rdv);
    for (let i=0;i<this.rdv_service.length;i++) {
      let employe=this.rdv_service[i];
      let info_emp = emps.filter(
        (emp) => emp._id.toString() == employe.id_employe.toString()
      )[0];
  
      let horaire = info_emp.horaire[date.getDay()];
      let service = services.filter(
        (service) => service._id.toString() == employe.id_service.toString()
      )[0];
      if (!in_horaire(date, horaire, service.duree)) {
        console.log("Tsy mety horaire");
       throw new Error("Tsy mety horaire");
      }
     
      if(await this.check_disponibilite(date, service.duree, employe.id_employe)){
        let fin=new Date(date);
        let debut=new Date(date)
        fin.setMinutes(fin.getMinutes()+service.duree);
        this.rdv_service[i].datedebut=debut;
        this.rdv_service[i].datefin=fin;
        this.rdv_service[i].prix=service.prix;
        console.log("Date debut",date,"Date fin",fin);
        console.log(this)
      }else{
        console.log("Mifanitsaka date");
        throw new Error("Mifanitsaka date")
      }
      date.setMinutes(service.duree + date.getMinutes());
    }
  },

  check_disponibilite:async function (debut, duree, id_employe) {
    let fin=new Date(debut);
    fin.setMinutes(fin.getMinutes()+duree);
    let rdv_model = mongoose.model("rdv", rdvSchema);
    let rdv_daty = await rdv_model.find({
      "rdv_service.id_employe": id_employe,
      "rdv_service.datedebut": {
        $lt: fin,
      },
      "rdv_service.datefin": {
        $gt: debut,
      },
    });
    console.log(rdv_daty);
    return rdv_daty.length==0;
  },
};


function overlap(a_start, a_end, b_start, b_end) {
  return a_start < b_end && a_end > b_start;
}
function interieur_interval(a_start, a_end, b_start, b_end) { //A interieur de B
  return (a_start > b_start) && (a_end < b_end)
}
function in_horaire(date, horaire, duree) {
  let farany = new Date(date);
  farany.setMinutes(duree + farany.getMinutes());
  let debutHeureMinute = horaire.debut.split(":");
  let finHeureMinute = horaire.fin.split(":");
  let begin = new Date(date);
  let end = new Date(date);
  begin.setHours(parseInt(debutHeureMinute[0]));
  begin.setMinutes(parseInt(debutHeureMinute[1]));

  end.setHours(parseInt(finHeureMinute[0]));
  end.setMinutes(parseInt(finHeureMinute[1]));
  return interieur_interval(date, farany, begin, end);
}



rdvSchema.statics.getServicePref = async function (id_client) {
  const clientId = id_client; // Identifiant du client à rechercher
  let valiny = [];
  await client
    .aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(clientId) } }, // Recherche du client par son identifiant
      {
        $lookup: {
          from: "service",
          localField: "fav_service",
          foreignField: "_id",
          as: "favoriteServices",
        },
      }, // Recherche des services favoris du client
      { $unwind: "$favoriteServices" }, // Dérouler les services favoris
      {
        $group: {
          _id: null,
          favoriteServiceIds: { $push: "$favoriteServices._id" },
        },
      }, // Grouper les IDs des services favoris
      { $project: { _id: 0, favoriteServiceIds: 1 } }, // Projeter uniquement les IDs des services favoris
      {
        $lookup: {
          from: "service",
          localField: "favoriteServiceIds",
          foreignField: "_id",
          as: "favoriteServices",
        },
      }, // Recherche des détails des services favoris
    ])
    .then(async (result) => {
      const favoriteServices =
        result.length === 0 ? [] : result[0].favoriteServices; // Récupérer les services favoris du client

      // Recherche de tous les services non favoris
      let otherServices = await Service.find({
        _id: { $nin: favoriteServices.map((service) => service._id) },
      });

      const availableServices = [...favoriteServices, ...otherServices]; // Fusionner les services favoris et les autres services disponibles
      valiny = availableServices;
    })
    .catch((err) => {
      console.error(
        "Erreur lors de la recherche des services favoris du client:",
        err
      );
    });
  return valiny;
};

rdvSchema.statics.getEmpPref = async function (id_client) {
  const clientId = id_client; // Identifiant du client à rechercher
  let valiny = [];
  await client
    .aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(clientId) } }, // Recherche du client par son identifiant
      {
        $lookup: {
          from: "employe",
          localField: "fav_employe",
          foreignField: "_id",
          as: "favoriteEmps",
        },
      }, // Recherche des services favoris du client
      { $unwind: "$favoriteEmps" }, // Dérouler les services favoris
      { $group: { _id: null, favoriteEmpIds: { $push: "$favoriteEmps._id" } } }, // Grouper les IDs des services favoris
      { $project: { _id: 0, favoriteEmpIds: 1 } }, // Projeter uniquement les IDs des services favoris
      {
        $lookup: {
          from: "employe",
          localField: "favoriteEmpIds",
          foreignField: "_id",
          as: "favoriteEmps",
        },
      }, // Recherche des détails des services favoris
    ])
    .then(async (result) => {
      const favoriteEmps = result.length === 0 ? [] : result[0].favoriteEmps; // Récupérer les services favoris du client
      // Recherche de tous les services non favoris
      // console.log(favoriteEmps);
      let otherEmps = await Employe.find({
        _id: { $nin: favoriteEmps.map((service) => service._id) },
      });

      const availableServices = [...favoriteEmps, ...otherEmps]; // Fusionner les services favoris et les autres services disponibles
      valiny = availableServices;
    })
    .catch((err) => {
      console.error(
        "Erreur lors de la recherche des services favoris du client:",
        err
      );
    });
  return valiny;
};

const rdv = mongoose.model("rdv", rdvSchema);
module.exports = rdv;
