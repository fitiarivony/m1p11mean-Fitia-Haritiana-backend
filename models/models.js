const mongoose = require('mongoose')
const Genre = require('./genre')

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
    identifiant: { type: String, default: '', trim: true, maxlength: 400 },
    mdp: { type: String, default: '', trim: true, maxlength: 400 },
    dateDeNaissance:{type: Date, default: Date.now},
    nom: { type: String, default: '', trim: true, maxlength: 400 },
    numeroCIN: { type: String, default: '', trim: true, maxlength: 12 },
    prenom: { type: String, default: '', trim: true, maxlength: 400 },
    genre:{ type:mongoose.Schema.Types.ObjectId, ref: 'Genre'}
  },
  { collection: 'employe' }
)

EmployeSchema.path('nom').required(true, "L'employé doit avoir un nom")
EmployeSchema.path('prenom').required(true, "L'employé doit avoir un prenom")
EmployeSchema.path('dateDeNaissance').required(true, "L'employé doit avoir une date de naissance")
EmployeSchema.path('numeroCIN').required(true, "L'employé doit avoir un numéro de CIN")
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
  },
}
EmployeSchema.statics.getAll = function () {
  return this.find({}).populate('genre').exec();
};
const Employe = mongoose.model('Employe', EmployeSchema)

module.exports = { Dog, Employe }
