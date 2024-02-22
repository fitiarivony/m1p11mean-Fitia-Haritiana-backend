const mongoose = require("mongoose");
const depenseSchema = new mongoose.Schema(
  {
    date_depense: {
      type: Date,
      required: true,
    },
    prix:{
        type:Number,
        required: true,
    },
    motif: {
      type: String,
      required: true,
    },
  },
  { collection: "depense" }
);
depenseSchema.statics.depense_mois = function() {
    return Depense.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$date_depense" },
              month: { $month: "$date_depense" }
            },
            totalDepense: { $sum: "$prix" }
          }
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            totalDepense: 1
          }
        }
    ]).then(result => {
        return result;
    }).catch(err => {
        throw err;
    });
}

const Depense = mongoose.model("depense", depenseSchema);
module.exports = Depense;
