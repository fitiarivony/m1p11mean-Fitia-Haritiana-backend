const mongoose = require('mongoose')
require('./models')
const OffreSpecialeSchema = new mongoose.Schema(
  {
    nomOffreSpeciale: { type: String, required: true },
    description: { type: String, required: true },
    service: { type: mongoose.Schema.ObjectId, ref: 'Service' },
    reduction: { type: Number, required: true },
    clientVises: {type: [mongoose.Schema.ObjectId], ref: 'Client'},
  },
  { collection: 'OffreSpeciale' }
)
OffreSpecialeSchema.statics.getAll = function () {
  return this.find({}).populate('service').exec()
}

const OffreSpeciale = mongoose.model('OffreSpeciale', OffreSpecialeSchema)
module.exports = OffreSpeciale
