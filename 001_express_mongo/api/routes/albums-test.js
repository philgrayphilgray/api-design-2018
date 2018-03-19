const { assert } = require('chai');
const request = require('supertest');

const app = require('../../app');
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
