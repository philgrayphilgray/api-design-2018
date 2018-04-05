## Simple Express/Mongo REST API 001_express_mongo

w/ TDD

### Setup project

#### Install initial dependencies

* Install Express, Nodemon, Morgan, Body-Parser, and Mongoose

```bash
npm init
npm install --save express nodemon morgan body-parser mongoose
```

#### Create server.js

* Require http
* Define port as process.env.PORT || 3000
* Assign http.createServer() instance to const server
* Call listen on the server, passing in the port

```bash
touch server.js
```

```js
const http = require('http');
const port = process.env.PORT || 3000;
const server = http.createServer();
server.listen(port);
```

#### Create app.js and setup logging

* Require morgan for logging
* Require body-parser (provides access to req.body object)
* Assign instance of express to const app
* Call morgan as middleware on the express app (using .use()), passing in “dev” (?)
* Call bodyParser.urlencoded() as middleware, passing in options object, {extended: false}
* Call bodyParser.json() as middleware
* Pass in a callback to app.use(), set the response to 200 and chain the json() method, passing in an object

```bash
touch app.js
```

#### Set response headers to handle CORS

* Create a new app.use() middleware, and inside the callback function call res.header() on each:
* Set Access-Control-Allow-Origin to \* (all)
* Set Access-Control-Allow-Headers to ‘Origin, X-Request-With, Content-Type, Accept, Authorization’
* Check if req.method has options, if so set Access-Control-Allow-Methods to “PUT, POST, PATCH, DELETE, GET”
* Return res with a 200 status and empty json({})
* Call next() at the end of the middleware
* Add error handling

```js
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Acess-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Request-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

app.use((req, res, next) => {
  res.status(200).json({
    message: 'hello world'
  });
});

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

module.exports = app;
```

#### Hookup express app to server

* Require `app` module in `server.js`
* Pass `app` to `http.createServer()`

```js
const http = require('http');

const app = require('./app');

const port = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(port);
```

#### Start the server

* Add an npm script to `package.json` to start the server using nodemon

```js
//package.json
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "nodemon server.js"
  },
```

* Start the server

```bash
npm run start
```

### Setup MongoDB

* Make sure mongo is installed locally
* Depending on the location, run the command to start it

```bash
mongod --dbpath ~/data/db
```

#### Configure Mongoose

* Create `database.js`
* Require `mongoose`
* Set `mongoose.Promise` equal to `global.Promise`
* Declare the evironment, database URL, and mongoose options
* Export

```js
// database.js
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const env = process.env.NODE_ENV || 'development';
const databaseUrl =
  process.env.DATABASE_URL || `mongodb://localhost/albumCollector_${env}`;
const options = {
  // useMongoClient option is no longer necesary in mongoose 5.x, please remove it
};

module.exports = {
  mongoose,
  databaseUrl,
  options
};
```

#### Connect MongoDB to Express via Mongoose

* Require mongoose, databaseUrl, and options from `database.js`
* Connect to mongoose; this should return a promise; move `server.listen(port)` inside the resolve callback

```js
//server.js

const http = require('http');
const app = require('./app');
const { mongoose, databaseUrl, options } = require('./database');

const port = process.env.PORT || 3000;

const server = http.createServer(app);

mongoose.connect(databaseUrl, options).then(() => {
  server.listen(port);
});
```

### Create API, writing server level tests first

* Create a new folder api
* Create a subfolder api/routes

```bash
mkdir -p api/routes
```

#### Configure testing utilities

* Install chai, mocha, supertest

```bash
npm install --save-dev chai mocha supertest
```

* Create a bin directory
* Add `mocha-test`

```sh
#/bin/sh

set -e

tests_that_are_not_features="$(ls */**/*-test.js | grep -v features)"

NODE_ENV=test ./node_modules/.bin/mocha ${tests_that_are_not_features}
```

* Make it executable

```bash
chmod +x bin/mocha-test
```

* Change `package.json` scrpts:tests

```js
"test": "bin/mocha-test",
```

#### Write first test

* Create albums-test.js in `api/routes/`
* Import mongoose, databaseUrl and options from `database.js`
* Implement setup and teardown utilities

```js
const { mongoose, databaseUrl, options } = require('../../database');

// setup and teardown utilities
beforeEach(async () => {
  await mongoose.connect(databaseUrl, options);
  await mongoose.connection.db.dropDatabase();
});
```

* Import `assert` from `chai`
* import `supertest`
* Write first failing test for create album
* POST an item and confirm that response code is `201` for Created

```js
const { assert } = require('chai');
const request = require('supertest');

const app = require('../../app');
const { mongoose, databaseUrl, options } = require('../../database');

// setup and teardown utilities
beforeEach(async () => {
  await mongoose.connect(databaseUrl, options);
  await mongoose.connection.db.dropDatabase();
});

afterEach(async () => {
  await mongoose.disconnect();
});

describe('Server path: `/create`', () => {
  describe('POST', async () => {
    it('should return a `201` status code when creating a new album', async () => {
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
```

* Test should fail because the route is not defined and api is responding to every request with a `200` status

#### Create the first route

```js
const router = require('express').Router();

router.get('/', (req, res, next) => {
  res.json({
    message: 'root'
  });
});

router.post('/create', (req, res, next) => {
  res.status(201).json(req.body);
});

module.exports = router;
```

### Refactor / write second test

* The first test should now be passing
* Wite a second test to make sure that the new album is actually being saved to the db

```js
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
```

* It fails, because we still need to create the model.

### Create the Album model

* Create a new `models` directory inside the `api` directory
* Create `album.js` in the models directory

```bash
mkdir -p api/models
touch api/models/album.js
```

* Inside `album.js`, require mongoose
* Create a new `mongoose.Schema`, passing in the field names, and giving them each types
* Create a mongoose.model by passing in a name and the schema
* Export the model

```js
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
```

* Require the model in both the `albums` route and route test files
* The tests should now be passing

### Write models test to assert types and required fields

* Create a `album-test.js` in the `api/models/` directory
* Require `{assert}` from chai
* Require `mongoose`, `databaseUrl`, and `options` from `database.js`
* Require the model from `album.js`
* Setup `beforeEach` and `afterEach` to connect, drop, and disconnect the db, as setup in the route test

```js
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
```

* Update the model to pass the tests

```js
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
```

### Write the test to GET all albums

* Create a new describe block for `GET /`
* Seed the database with two albums
* Attempt to GET `/`
* Assert that `response.body` includes the titles of the newly created objects

```js
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
```

### Update the GET / route to get all albums

* Use mongoose.find({})
* Pass the mongoose object into a json response

```js
router.get('/', async (req, res, next) => {
  const albums = await Album.find({}).exec();
  res.json(albums);
});
```

### Complete CRUD operations for one album

#### Read one

##### Write test to GET one album

* Seed the db with one album
* Get the one album in the db and destructure its `_id` property
* GET `/:id` with supertest
* Assert that the response contains the title and artist of the `sampleAlbum`

```js
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
});
```

##### Write route to GET one album

* Setup a new dynamic route which will capture the album id in `req.params`
* Use `findById` to get the album with that id
* Respond with the json for that album

```js
router.get('/:id', async (req, res, next) => {
  const album = await Album.findById({ _id: req.params.id });
  res.json(album);
});
```

#### Delete one

##### Write delete one test

* Seed the db with one album
* Get the one album in the db and destructure its `_id` property
* DELETE `/:id` with supertest
* Find all albums, and assert that the object is empty

```js
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
```

##### Create route to delete on album

* Setup a new dynamic route which will capture the album id in `req.params`
* Use `findByIdAndRemove` to get the album with that id and remove it from the db
* Respond with a confirmation message that the album with that id was deleted

```js
// Setup a new dynamic route which will capture the album id in `req.params`
router.delete('/:id', async (req, res, next) => {
  // Use `findByIdAndRemove` to get the album with that id
  const album = await Album.findByIdAndRemove({ _id: req.params.id });

  // Respond with a confirmation message that the album with that id was deleted
  res.json({ message: `${req.params.id} was deleted.` });
});
```

#### Update one

##### Write update one test

* Seed the db with one album
* Get the one album in the db and destructure its `_id` property
* Create an update object with a new title
* POST the update object to `/:id/update` with supertest
* Find the album and assert that its title has changed

```js
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
```

##### Create update one route

* Setup a new dynamic route which will capture the album id in `req.params`
* Use `findByIdAndUpdate` to get the album with that id and update it, including the `{ new: true }` option
* Respond with the updated album

```js
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
```

### Associate albums with user collections
