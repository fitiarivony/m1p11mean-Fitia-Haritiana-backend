const mongoose = require("mongoose");

const serviceSchema = mongoose.Schema(
  {
    nom_service: {
      type: String,
      required: [true,"Le nom  est obligatoire"],
      validate: {
        validator: function(v) {
          return v!==null && v.trim().length !== 0;
        },
        message: props => `Le nom est obligatoire`
      },
    },

    prix: {
      type: Number,
      required: [true,"Le prix  est obligatoire"],
      validate: {
        validator: function(v) {
          return v!==null && typeof v === 'number';
        },
        message: props => `Le prix doit être un nombre`
      },
    },
    duree: {
      type: Number,
      required: [true,"La durée   est obligatoire"],
      validate: {
        validator: function(v) {
          return v!==null && typeof v === 'number';
        },
        message: props => `La durée doit être un nombre`
      },
    },
    comission: {
      type: Number,
      required: [true,"La comission  est obligatoire"],
      validate: {
        validator: function(v) {
          return v!==null && typeof v === 'number';
        },
        message: props => `La comission doit être un nombre`
      },
    },
  },
  { collection: "service" }
);

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
