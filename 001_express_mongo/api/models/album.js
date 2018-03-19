const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required.']
  },
  artist: {
    type: String
  }
});

module.exports = mongoose.model('Album', albumSchema);
