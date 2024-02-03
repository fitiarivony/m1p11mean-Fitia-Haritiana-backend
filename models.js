const mongoose = require('mongoose')

const DogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  breed: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  isGoodBoy: {
    type: Boolean,
    required: false,
    default: true
  }
})

const Dog = mongoose.model('Dog', DogSchema)

const EmployeSchema = new mongoose.Schema(
  {
    nom_employe: { type: String, default: '', trim: true, maxlength: 400 },
    identifiant: { type: String, default: '', trim: true, maxlength: 400 },
    mdp: { type: String, default: '', trim: true, maxlength: 400 }
  },
  { collection: 'employe' }
)

EmployeSchema.path('nom_employe').required(true, "L'employé doit avoir un nom")
EmployeSchema.path('identifiant').required(
  true,
  "l'identifiant ne peut pas être vide"
)
EmployeSchema.path('mdp').required(
  true,
  'le mot de passe ne peut pas être vide'
)

EmployeSchema.methods = {
  login: async function () {
    const Employe = mongoose.model('Employe', EmployeSchema)
    const res = await Employe.findOne({ identifiant: this.identifiant }).exec()
    if (res) {
      if (res.mdp === this.mdp) {
        console.log('Login successful!')
        return 'Login successful!'
      }
      else{
        // return 'Mot de passe éronné'
        throw new Error('Mot de passe éronné')
      }
    } else {
      console.log('Login failed. Incorrect identifier or password.')
      throw new Error('Login erroné')
    }
  }
}
const Employe = mongoose.model('Employe', EmployeSchema)

module.exports = { Dog, Employe }
