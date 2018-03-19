const { assert } = require('chai');

const { mongoose, databaseUrl, options } = require('./../../database');
const Album = require('./album');

describe('Model: Album', () => {
  beforeEach(async () => {
    await mongoose.connect(databaseUrl, options);
    await mongoose.connection.db.dropDatabase();
  });
  afterEach(async () => {
    await mongoose.disconnect();
  });

  describe('#title', () => {
    it('is a String', () => {
      const title = 1;
      const album = new Album({ title });
      assert.strictEqual(album.title, title.toString());
    });

    it('is required', () => {
      const title = '';
      const album = new Album({ title });
      album.validateSync();
      assert.equal(album.errors.title.message, 'Title is required.');
    });
  });
});
