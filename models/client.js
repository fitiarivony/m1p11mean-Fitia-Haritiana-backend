const mongoose = require('mongoose')
const Token = require('./token')
const crypto = require('crypto')
const { populate } = require('./genre')

const clientSchema = mongoose.Schema(
  {
    nom_client: {
      type: String,
      required: [true, 'Le nom est obligatoire']
    },
    prenom_client: {
      type: String,
      required: [true, 'Le prenom est obligatoire']
    },
    identifiant: {
      type: String,
      required: [true, "L'identifiant est obligatoire"]
    },
    mdp: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire']
    },
    numero: {
      type: String,
      required: [true, 'Le numero est obligatoire']
    },
    fav_employe: { type: [mongoose.Schema.Types.ObjectId], ref: 'Employe' },
    fav_service: { type: [mongoose.Schema.Types.ObjectId], ref: 'Service' },
    reduction: [{
      offre: { type: mongoose.Schema.Types.ObjectId, ref: 'OffreSpeciale' },
      nombre: { type: Number, default: 1 }
    }]
  },
  { collection: 'client' }
)
clientSchema.statics.getReductions = async function (id) {
  const Client = mongoose.model('client', clientSchema)
  let cl = await Client.findById(id)
    .populate({
      path: 'reduction',
      populate: { path: 'offre', populate: { path: 'service' } }
    })
    .exec()
  // // //console.log(cl.reduction);
  return cl.reduction
}
clientSchema.methods = {
  login: async function () {
    const Client = mongoose.model('client', clientSchema)
    const client = await Client.findOne(
      { identifiant: this.identifiant },
      { __v: 0 }
    ).exec()
    if (client) {
      if (client.mdp === this.mdp) {
        // //console.log('Login successful!!')
        let daty = new Date()
        daty.setHours(daty.getHours() + 1)
        const sha1Hash = crypto.createHash('sha1')
        sha1Hash.update(client._id + Date.now())
        let token = new Token({
          date_expiration: daty,
          token: sha1Hash.digest('hex'),
          id_admin: client._id,
          statut: 3
        })
        await token.save()
        return { admin: client, token: token }
      } else {
        //return Mot de passe erroné!
        // //console.log("Mot de passe erroné!");
        throw new Error('Mot de passe erroné')
      }
    } else {
      // //console.log('Login failed')
      throw new Error('Login erroné')
    }
  }
}

const client = mongoose.model('client', clientSchema)
module.exports = client
