const mongoose = require("mongoose");

const managerSchema=new mongoose.Schema({
    nom:{
      type: String,
      required: true,
    },
    identifiant:{
      type: String,
      required: true,
    },
    mdp:{
      type: String,
      required: true,
    }
  },{ collection: 'manager' })
  const Manager=mongoose.model('manager', managerSchema);
  module.exports = Manager;