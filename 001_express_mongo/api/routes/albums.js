const router = require('express').Router();

const Album = require('../models/album');

router.get('/', async (req, res, next) => {
  const albums = await Album.find({}).exec();
  res.json(albums);
});

router.get('/:id', async (req, res, next) => {
  const album = await Album.findById({ _id: req.params.id });
  res.json(album);
});

// Setup a new dynamic route which will capture the album id in `req.params`
router.delete('/:id', async (req, res, next) => {
  // Use `findByIdAndRemove` to get the album with that id
  const album = await Album.findByIdAndRemove({ _id: req.params.id });

  // Respond with a confirmation message that the album with that id was deleted
  res.json({ message: `${req.params.id} was deleted.` });
});

// Setup a new dynamic route which will capture the album id in `req.params`

router.post('/:id/update', async (req, res, next) => {
  // Use `findByIdAndUpdate` to get the album with that id and update it, including the `{ new: true }` option
  const album = await Album.findByIdAndUpdate(
    { _id: req.params.id },
    req.body,
    { new: true }
  );
  //   Respond with the updated album
  res.json(album);
});

router.post('/create', async (req, res, next) => {
  const newAlbum = await new Album(req.body);
  newAlbum.save();
  const album = await Album.findOne(req.body);
  res.status(201).json(album);
});

module.exports = router;
