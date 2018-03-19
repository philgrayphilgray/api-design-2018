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
  describe('POST', async () => {
    it('should add a new album to the database', async () => {
      const newAlbum = {
        title: 'Space Is the Place',
        artist: 'Sun Ra'
      };

      const response = await request(app)
        .post('/create')
        .type('json')
        .send(newAlbum);

      assert.equal(response.status, 201);
    });
  });
});
