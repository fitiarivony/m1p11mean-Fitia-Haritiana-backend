const mongoose = require('mongoose')
const GenreSchema = new mongoose.Schema({
  nomGenre: { type: String, required: true }},
  { collection: 'genre' }
)
GenreSchema.statics.getAll = function () {
  return this.find({}).exec();
};

const Genre=mongoose.model('Genre', GenreSchema)
module.exports = Genre