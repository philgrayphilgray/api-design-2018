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

      const { _id } = Album.findOne({}).exec();

      // get /:id
      const response = await request(app).get(`/${_id}`);

      // assert that the response contains the title and artist of the sampleAlbum

      assert.include(JSON.stringify(response.body), sampleAlbum.title);
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
