const { assert } = require('chai');
const request = require('supertest');

const app = require('../../app');
const Album = require('../models/album');
const { mongoose, databaseUrl, options } = require('../../database');

// setup and teardown utilities
beforeEach(async () => {
  // connect database and drop data
  await mongoose.connect(databaseUrl, options);
  await mongoose.connection.db.dropDatabase();
});

afterEach(async () => {
  // disconnect database
  await mongoose.disconnect();
});

describe('Server path: `/`', () => {
  describe('GET', () => {
    it('should return all albums in the database', async () => {
      // seed the database
      const firstAlbum = {
        title: 'Space Is the Place',
        artist: 'Sun Ra'
      };

      const secondAlbum = {
        title: 'Lanquidity',
        artist: 'Sun Ra'
      };

      await request(app)
        .post('/create')
        .send(firstAlbum);

      await request(app)
        .post('/create')
        .send(secondAlbum);

      // request all

      const response = await request(app).get('/');

      assert.include(JSON.stringify(response.body), firstAlbum.title);
      assert.include(JSON.stringify(response.body), secondAlbum.title);
    });
  });
});

describe('Server path: `/:id`', () => {
  describe('GET', () => {
    it('should return the title and artist the album', async () => {
      // seed the database with one album
      const sampleAlbum = {
        title: 'Space Is the Place',
        artist: 'Sun Ra'
      };

      await request(app)
        .post('/create')
        .send(sampleAlbum);

      // get the one album in the db and destructure its _id property

      const { _id } = await Album.findOne({}).exec();

      // get /:id
      const response = await request(app).get(`/${_id}`);

      // assert that the response contains the title and artist of the sampleAlbum

      assert.include(JSON.stringify(response.body), sampleAlbum.title);
    });
  });

  describe('DELETE', () => {
    it('should remove the album from the db', async () => {
      // Seed the db with one album
      const sampleAlbum = {
        title: 'Space Is the Place',
        artist: 'Sun Ra'
      };

      await request(app)
        .post('/create')
        .send(sampleAlbum);

      // get the one album in the db and destructure its _id property

      const { _id } = await Album.findOne({}).exec();

      // delete /:id
      await request(app).delete(`/${_id}`);

      // Find all albums, and assert that the object is empty
      const response = await Album.find({}).exec();

      assert.isEmpty(response);
    });
  });
});

describe('Server path: `/:id/update`', () => {
  describe('POST', () => {
    it('should update the item in the db', async () => {
      // Seed the db with one album
      const sampleAlbum = {
        title: 'Space Is the Place',
        artist: 'Sun Ra'
      };

      await request(app)
        .post('/create')
        .send(sampleAlbum);

      // Get the one album in the db and destructure its `_id` property
      const { _id } = await Album.findOne({}).exec();

      // Create an update object with a new title
      const update = {
        title: 'Interstellar Low Ways'
      };

      // POST an an updated title to `/:id/update` with supertest
      await request(app)
        .post(`/${_id}/update`)
        .send(update);

      // Find the album and assert that its title has changed

      const updatedAlbum = await Album.findById({ _id });

      assert.equal(updatedAlbum.title, update.title);
    });
  });
});

describe('Server path: `/create`', () => {
  describe('POST', () => {
    it('should return a `201` status code when creating a new album', async () => {
      const newAlbum = {
        title: 'Space Is the Place',
        artist: 'Sun Ra'
      };

      const response = await request(app)
        .post('/create')
        .send(newAlbum);

      assert.equal(response.status, 201);
    });

    it('should save the new album to the database', async () => {
      const newAlbum = {
        title: 'Space Is the Place',
        artist: 'Sun Ra'
      };

      const response = await request(app)
        .post('/create')
        .send(newAlbum);

      const createdAlbum = await Album.findOne(newAlbum);

      assert.isOk(createdAlbum);
    });
  });
});
