const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  title: {
    type: String
  },
  artist: {
    type: String
  }
});

module.exports = mongoose.model('Album', albumSchema);
