const mongoose = require('mongoose')
require('./models')
const OffreSpecialeSchema = new mongoose.Schema(
  {
    nomOffreSpeciale: { type: String, required: true },
    description: { type: String, required: true },
    service: { type: mongoose.Schema.ObjectId, ref: 'Service' },
    reduction: { type: Number, required: true },
    clientVises: { type: [mongoose.Schema.ObjectId], ref: 'Client' },
    isa: { type: Number, required: true, default: 1 },
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },
    nombre: { type: Number, required: true, default: 1 }
  },
  { collection: 'OffreSpeciale' }
)
OffreSpecialeSchema.statics.getAll = function () {
  return this.find({}).populate('service').exec()
}
OffreSpecialeSchema.statics.getSpecialOffersByIds = async (idArray) => {
  
const OffreSpeciale = mongoose.model('OffreSpeciale', OffreSpecialeSchema)
  try {
    const result = await OffreSpeciale.find({ _id: { $in: idArray } })
      .select('_id nomOffreSpeciale reduction service')
      .populate('service')
      .exec()

    return result
  } catch (error) {
    console.error(error)
    throw error
  }
}

const OffreSpeciale = mongoose.model('OffreSpeciale', OffreSpecialeSchema)
module.exports = OffreSpeciale
