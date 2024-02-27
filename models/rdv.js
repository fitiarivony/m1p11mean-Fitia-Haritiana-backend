const mongoose = require("mongoose");
const Service = require("./service_model");
const client = require("./client");
const OffreSpeciale= require("./offre_speciale")
const { Employe } = require("./models");
const Mailer = require("../models/mailer");
const Depense = require("./depense");

const rdvSchema = mongoose.Schema(
  {
    id_client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'client',
      required: true
    },
    date_rdv: {
      type: Date,
      required: true
    },
    reduction: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'OffreSpeciale',
      required: true
    },
    rdv_service: [
      {
        id_employe: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employe',
          required: true
        },
        id_service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service',
          required: true
        },
        ordre: {
          type: Number,
          required: true
        },
        datedebut: {
          type: Date,
          required: true
        },
        datefin: {
          type: Date,
          required: true
        },
        is_done: {
          type: Boolean,
          required: true,
          default: false
        },
        prix: {
          type: Number,
          required: true,
        },
      },
    ],
    paye: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  { collection: 'rdv' }
)
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
  let total = 0;
  for (let rdv of list_rdv) {
    let date_rdv = rdv.date_rdv;
    let rdv_du = [];
    for (let rdv_service of rdv.rdv_service) {
      let essai = {};
      essai = { ...rdv_service.toObject() };
      let service = data.filter(
        (service) =>
          service._id.toString() == rdv_service.id_service._id.toString()
      )[0];

      if (rdv_service.id_employe._id.toString() == id_employe.toString()) {
        essai.id_rdv = rdv._id;
        essai.date_rdv = new Date(date_rdv);
        essai.id_client = rdv.id_client;
        newData.push(essai);
        if (rdv_service.is_done)
          total += essai.prix * (service.comission / 100);
      }

      date_rdv.setMinutes(date_rdv.getMinutes() + service.duree);

      console.log("Minutes to add", service.duree, "=" + date_rdv);
    }
    // newData.push(rdv_du);
  }
  console.log("Total=", total);
  return { data: newData, total: total };
};



rdvSchema.statics.check_dispo = async function (rdv_services, id_rdv) {
  let rdv_model = mongoose.model("rdv", rdvSchema);
  if (!rdv) {
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
      if (rdv_daty.length != 0) throw new Error("L'employé n'est pas disponible");
    }
  }
  for (const rdv_service of rdv_services) {
    let rdv_daty = await rdv_model.find({
      "rdv_service.id_employe": rdv_service.id_employe,
      "rdv_service.datedebut": {
        $lt: rdv_service.datefin,
      },
      "rdv_service.datefin": {
        $gt: rdv_service.datedebut,
      },
      _id: {
        $ne: id_rdv,
      },
    });
    console.log(rdv_daty);
    if (rdv_daty.length != 0) throw new Error("L'employé n'est pas disponible");
  }
};

rdvSchema.statics.getRdvTomorrow = async function () {
  // Calculate the start and end of tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);
  const Rdv = mongoose.model("rdv", rdvSchema);
  try {
    // Query the rdv collection for appointments scheduled for tomorrow
    const appointments = await Rdv.find({
      date_rdv: {
        $gte: tomorrow,
        $lte: endOfTomorrow,
      },
    })
      .populate("rdv_service.id_service")
      .populate("id_client")
      .exec();
    // Log the appointments for tomorrow
    console.log("Appointments for tomorrow:", appointments);
    return appointments;
  } catch (error) {
    console.error("Error retrieving appointments:", error);
  } finally {
    // Close the MongoDB connection when done
    mongoose.disconnect();
  }
};
rdvSchema.statics.remindRdv = async function () {
  const Rdv = mongoose.model("rdv", rdvSchema);
  let tom = await Rdv.getRdvTomorrow();
  console.log(tom);
  tom.map((rdv) => {
    let person = rdv.id_client;
    let mail = "<p>";
    mail +=
      "Très cher(e) client(e) " +
      person.nom_client +
      " " +
      person.prenom_client +
      ", n'oubliez pas votre rendez-vous prévu pour le ";
    let date = rdv.date_rdv;
    mail = mail.concat(date.toLocaleString());
    mail = mail.concat(" pour faire ");
    let serviceTab = rdv.rdv_service;
    serviceTab.map((service) => {
      mail = mail.concat(service.id_service.nom_service).concat(", ");
    });
    mail = mail.slice(0, -2);
    mail = mail.concat("</p>");
    console.log(mail);

    Mailer.sendSpecialOffer(
      [person.identifiant],
      "Rappel de rdv chez Foo",
      mail
    );
  });
  //
}
rdvSchema.statics.getAvgRdv = async function () {
  const Rdv = mongoose.model('rdv', rdvSchema)
  // console.log('niditra')
  let resMonth = await Rdv.aggregate([
    {
      $group: {
        _id: { $month: '$date_rdv' },
        totalPrix: { $sum: { $sum: '$rdv_service.prix' } },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id',
        avgPrix: { $avg: '$totalPrix' },
        avgCount: { $avg: '$count' }
      }
    }
  ])
  let result = await Rdv.aggregate([
    {
      $group: {
        _id: { $dayOfWeek: '$date_rdv' },
        totalPrix: { $sum: { $sum: '$rdv_service.prix' } },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id',
        avgPrix: { $avg: '$totalPrix' },
        avgCount: { $avg: '$count' }
      }
    }
  ])
  return {
    avgNbDay: result,
    avgNbMonth: resMonth
  }
}
rdvSchema.methods = {
  save_emp: async function () {
    try {
      let services = await Service.find();
      let emps = await Employe.find();
      await this.check_horaire(emps, services);
      await this.save();
    } catch (error) {
      throw error;
    }
  },
  update_emp: async function (id_rdv) {
    try {
      let services = await Service.find();
      let emps = await Employe.find();
      await this.check_horaire(emps, services, id_rdv);
      let rdv_model = mongoose.model("rdv", rdvSchema);
      await rdv.findByIdAndUpdate(id_rdv, {
        $set: { rdv_service: this.rdv_service, date_rdv: this.date_rdv, reduction: this.reduction },
      });
    } catch (error) {
      throw error;
    }
  },
  check_horaire: async function (emps, services, id_rdv) {
    console.log("Check horaire");
    let id_reductions=this.reduction
    let reductions=await OffreSpeciale.find({ _id: { $in: id_reductions } }).exec()
    let date = new Date(this.date_rdv);
    for (let i = 0; i < this.rdv_service.length; i++) {
      let employe = this.rdv_service[i];
      let service = services.filter(
        (service) => service._id.toString() == employe.id_service.toString()
      )[0];

      let info_emp = emps.filter(
        (emp) => emp._id.toString() == employe.id_employe.toString()
      )[0];

      let horaires = info_emp.horaire.filter(
        (horaire) => horaire.jour === date.getDay()
      );
      let inside_horaire = false;
      for (const horaire of horaires) {
        console.log("check horaire");
        if (in_horaire(date, horaire, service.duree)) {
          inside_horaire = true;
          break;
        }
      }
      if (!inside_horaire) {
        throw new Error("Tsy anatin horaire");
      }

      if (
        await this.check_disponibilite(
          date,
          service.duree,
          employe.id_employe,
          id_rdv
        )
      ) {
        let fin = new Date(date);
        let debut = new Date(date);
        fin.setMinutes(fin.getMinutes() + service.duree);
        this.rdv_service[i].datedebut = debut;
        this.rdv_service[i].datefin = fin;
        this.rdv_service[i].prix = service.prix;
        let prix=service.prix
        reductions.map((reduction) =>{
          console.log("compaison reduction",reduction.service,this.rdv_service[i].id_service);
          if(reduction.service.toString()===this.rdv_service[i].id_service.toString()){
            // console.log("tafiditra réduction");
            if (this.rdv_service[i].pi === undefined) this.rdv_service[i].pi = prix
            if (this.rdv_service[i].reduc === undefined) this.rdv_service[i].reduc = 0
            this.rdv_service[i].reduc += reduction.reduction
            this.rdv_service[i].prix = (this.rdv_service[i].pi * (100 - this.rdv_service[i].reduc)) / 100
            // console.log(this.rdv_service[i].prix);
          }
        })
        //TODO: prix
        console.log("Date debut", date, "Date fin", fin);
        console.log(this);
      } else {
        console.log("Mifanitsaka date");
        throw new Error("L'employé n'est pas disponible");
      }
      date.setMinutes(service.duree + date.getMinutes());
    }
  },

  check_disponibilite: async function (debut, duree, id_employe, id_rdv) {
    let fin = new Date(debut);
    fin.setMinutes(fin.getMinutes() + duree);
    let rdv_model = mongoose.model("rdv", rdvSchema);
    if (!id_rdv) {
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
      return rdv_daty.length == 0;
    }
    let rdv_daty = await rdv_model.find({
      "rdv_service.id_employe": id_employe,
      "rdv_service.datedebut": {
        $lt: fin,
      },
      "rdv_service.datefin": {
        $gt: debut,
      },
      _id: {
        $ne: id_rdv,
      },
    });
    console.log(rdv_daty);
    return rdv_daty.length == 0;
  },
};

function overlap(a_start, a_end, b_start, b_end) {
  return a_start < b_end && a_end > b_start;
}
function interieur_interval(a_start, a_end, b_start, b_end) {
  //A interieur de B
  return a_start > b_start && a_end < b_end;
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

rdvSchema.statics.temps_moyen_travail = async function () {
  try {
    const rdvs = await rdv.find({}).populate("rdv_service.id_employe","nom prenom").exec() // Récupérer tous les rendez-vous

    const tempsTravailParEmploye = {} // Stocker la durée de travail pour chaque employé
    const rdvCompteurParEmploye = {}
    let tab=[];
    rdvs.forEach(rdv => {
      rdv.rdv_service.forEach(service => {
        if (service.is_done) {
          const tempsTravail = service.datefin - service.datedebut // Durée de travail pour ce rendez-vous
          if (!tempsTravailParEmploye[service.id_employe]) {
            tempsTravailParEmploye[service.id_employe._id] = tempsTravail
            rdvCompteurParEmploye[service.id_employe._id] = 1
            tab.push(service.id_employe)
          } else {
            tempsTravailParEmploye[service.id_employe._id] += tempsTravail
            rdvCompteurParEmploye[service.id_employe._id]++
          }
        }
      })
    })

    // Calculer le temps moyen de travail pour chaque employé
    const tempsMoyenTravail = []
    for (const employeId in tempsTravailParEmploye) {
      // Calculer la durée de travail en heures et minutes
      let tempsTravail;
      let diffMs =
        tempsTravailParEmploye[employeId] / rdvCompteurParEmploye[employeId];
      if (diffMs >= 3600000) {
        // Si la durée est d'au moins 1 heure (3600000 millisecondes)
        const heures = Math.floor(diffMs / 3600000) // Calculer les heures
        const minutes = Math.round((diffMs % 3600000) / 60000) // Calculer les minutes restantes
        tempsTravail = `${heures} heure(s) ${minutes} minute(s)`
      } else {
        // Si la durée est inférieure à 1 heure
        const minutes = Math.ceil(diffMs / 60000) // Calculer les minutes
        tempsTravail = `${minutes} minute(s)`
      }
      
      tempsMoyenTravail.push({
        employe:tab.filter(employe=>employe._id.toString()===employeId)[0],
        tempsTravail:tempsTravail,
        isa:diffMs
      });
    }
    
    return tempsMoyenTravail
  } catch (error) {
    console.error(
      'Erreur lors du calcul du temps moyen de travail par employé :',
      error
    )
    throw error
  }
};
rdvSchema.statics.benefice_mois = async function () {
  try {
    let result = await rdv.aggregate([
      {
        $lookup: {
          from: "client", // The name of the client collection
          localField: "id_client",
          foreignField: "_id",
          as: "client",
        },
      },
      {
        $match: { paye: true }, // Filtrer les rendez-vous payés uniquement
      },
      {
        $unwind: "$rdv_service", // unwind rdv_service array if needed
      },
      {
        $lookup: {
          from: "service", // The name of the service collection
          localField: "rdv_service.id_service",
          foreignField: "_id",
          as: "rdv_service.id_service", // Storing service details in rdv_service field
        },
      },
      {
        $lookup: {
          from: "employe", // The name of the service collection
          localField: "rdv_service.id_employe",
          foreignField: "_id",
          as: "rdv_service.id_employe", // Storing service details in rdv_service field
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date_rdv" }, // Extracting the year from date_rdv
            month: { $month: "$date_rdv" }, // Extracting the month from date_rdv
          },
          appointments: {
            $push: {
              _id: "$_id",
              rdv_service: "$rdv_service",
              client: "$client",
              paye: "$paye",
            },
          },
          // Counting the number of appointments
        },
      },
    ]);

    let bilan = [];
    // console.log(result);
    // console.log(result[0].appointments.length);
    for (let resultat_mois of result) {
      let calcul = {
        recette: 0,
        depense: 0,
        mois: resultat_mois._id.month,
        annee: resultat_mois._id.year,
        autre_depense:0
      };
      for (const rendez_vous of resultat_mois.appointments) {
        calcul.recette += rendez_vous.rdv_service.prix;
        if (rendez_vous.rdv_service.is_done) {
          calcul.depense +=
            rendez_vous.rdv_service.prix *
            (rendez_vous.rdv_service.id_service[0].comission / 100);
        }
      }
      bilan.push(calcul)
    }
    // console.log(bilan);
    let autre_depense = await Depense.depense_mois();
    // console.log(autre_depense);
    for (const depense of autre_depense) {
      let dep = bilan.filter(
        (bil) => bil.mois === depense.month && depense.year == bil.annee
      )[0];
      if (dep) {
        bilan[bilan.indexOf(dep)].autre_depense = depense.totalDepense;
      } else {
        let new_bilan = {
          recette: 0,
          depense: 0,
          mois: depense.year,
          annee: depense.month,
          autre_depense: depense.totalDepense,
        };
        bilan.push(new_bilan);
      }
      // console.log(dep);
    }
    // console.log(autre_depense);
    // console.log(bilan);
    return bilan;
  } catch (error) {
    throw error;
  }
};

rdvSchema.statics.filtre_rdv = async function (
  datedebut,
  datefin,
  id_employe,
  services
) {
  // a_start > b_start && a_end < b_end a interieur de b
  let list_rdv = [];
  let Rdv = mongoose.model("rdv", rdvSchema);
  let conditions = {};
  
  if (datedebut !== null && datefin !== null) {
    conditions = {
      

      "rdv_service.datedebut": {
        $gt: datedebut,
        $lt: datefin,
      },
    };
  } else if (datefin !== null && datedebut === null) {
    conditions = {
      "rdv_service.datedebut": {
        $lt: datefin,
      },
    };
  } else if (datedebut !== null && datefin === null) {
    conditions = {
      "rdv_service.datedebut": {
        $gte: datedebut,
      },
    };
  }
  if (services.length > 0) {
    conditions["rdv_service.id_service"] = { $in: services };
  }
  conditions["rdv_service.id_employe"]= new mongoose.Types.ObjectId(id_employe);
  console.log(conditions);
  list_rdv = await Rdv.get(conditions, { __v: 0 });
 
  return list_rdv;
};

rdvSchema.statics.filtreRdvEmp = async function (list_rdv, id_employe,services,servicesStringId) {
  let data = await Service.find();
  let newData = [];
  console.log("Emp=", id_employe);
  let total = 0;
  for (let rdv of list_rdv) {
    let rdv_du = [];
    for (let rdv_service of rdv.rdv_service) {
      let essai = {};
      essai = { ...rdv_service.toObject() };
      let service = data.filter(
        (service) =>
          service._id.toString() == rdv_service.id_service._id.toString()
      )[0];
      
      if (rdv_service.id_employe._id.toString() == id_employe.toString()) {
        if((servicesStringId.length>0 && servicesStringId.includes(rdv_service.id_service._id.toString())) || servicesStringId.length===0 ){

          essai.id_rdv = rdv._id;
          essai.date_rdv = rdv_service.datedebut;
          essai.id_client = rdv.id_client;
          newData.push(essai);
          if (rdv_service.is_done)
            total += essai.prix * (service.comission / 100);

        }
      
      }
    }
  }
  console.log("Total=", total);
  return { data: newData, total: total };
};

const rdv = mongoose.model("rdv", rdvSchema);
module.exports = rdv;
