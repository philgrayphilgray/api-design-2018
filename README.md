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

## graphql-simple with Prisma

### Setup

* Following the quickstart tutorial with boilerplate

Source: [Node.js Prisma Quickstart](https://www.prisma.io/docs/quickstart/backend/node/node-phe8vai1oo)

* Install Docker
* Install Prisma
* Start the local prisma service

```bash
npm install -g prisma
prisma local start
```

* Bootstrap and deploy GraphQL server

```bash
prisma init <project-name>
...
select GraphQL server/full stack boilerplate (recommended)
select node-basic
select local
```

* Start the dev server

```bash
cd <project name>
yarn dev
```

### Changing the data model

Source:
[Getting started with Prisma](https://www.prisma.io/docs/tutorials/prisma-basics/getting-started-ouzia3ahqu)

* Add User type to data model

```js
// database/datamodel.graphql

type User {
  id: ID! @unique
  name: String!
}
```

* Re-deploy. Prisma will auto-generate CRUD operations for the model in the db server.

```js
prisma deploy
```

* Create a user in the playground. (Only possible at this point in the database server).

```js
// request

mutation {
  createUser(data: {
    name:"Phil"
  }){
    name
    id
  }
}

// response

{
  "data": {
    "createUser": {
      "name": "Phil",
      "id": "cjfn0asyx001m07831k3wbevy"
    }
  }
}
```

* We can now query all users

```js
// request

{
  users{
    id
    name
  }
}

// response

{
  "data": {
    "users": [
      {
        "id": "cjfn0asyx001m07831k3wbevy",
        "name": "Phil"
      }
    ]
  }
}
```

* Add User to Query and Mutation schema for app

```js
# import Post from "./generated/prisma.graphql"
# import User from "./generated/prisma.graphql"

type Query {
  feed: [Post!]!
  drafts: [Post!]!
  post(id: ID!): Post
  users: [User!]!
  user(id: ID!): User
}

type Mutation {
  createDraft(title: String!, text: String): Post
  deletePost(id: ID!): Post
  publish(id: ID!): Post
  createUser(name: String!): User
}
```

* Add to resolvers for app

```js
// in index.js

const resolvers = {
  Query: {
    feed(parent, args, ctx, info) {
      return ctx.db.query.posts({ where: { isPublished: true } }, info);
    },
    drafts(parent, args, ctx, info) {
      return ctx.db.query.posts({ where: { isPublished: false } }, info);
    },
    post(parent, { id }, ctx, info) {
      return ctx.db.query.post({ where: { id } }, info);
    },
    // single user resolver
    user(parent, args, ctx, info) {
      return ctx.db.query.users({ where: { id } }, info);
    },
    // all users resolver
    users(parent, args, ctx, info) {
      return ctx.db.query.users({}, info);
    }
  },
  Mutation: {
    createDraft(parent, { title, text }, ctx, info) {
      return ctx.db.mutation.createPost(
        {
          data: {
            title,
            text,
            isPublished: false
          }
        },
        info
      );
    },
    // createUser mutation resolver
    createUser(parent, { name }, ctx, info) {
      return ctx.db.mutation.createUser(
        {
          data: {
            name
          }
        },
        info
      );
    },
    deletePost(parent, { id }, ctx, info) {
      return ctx.db.mutation.deletePost({ where: { id } }, info);
    },
    publish(parent, { id }, ctx, info) {
      return ctx.db.mutation.updatePost(
        {
          where: { id },
          data: { isPublished: true }
        },
        info
      );
    }
  }
};
```

* Restart the dev server
* We can now create and query users from the app server

```js
// request

mutation{
  createUser(
    name:"Cheongah"
  ){
    name
    id
  }
}

// response

{
  "data": {
    "createUser": {
      "name": "Cheongah",
      "id": "cjfn0wup500220783ybt6frab"
    }
  }
}
```

### Relate the Post model to the User model

Source: [Changing the data model and updating the API](https://www.prisma.io/docs/tutorials/prisma-basics/changing-the-data-model-va4ga2phie)

* Change the data model

```js
type Post {
  id: ID! @unique
  isPublished: Boolean! @default(value: false)
  title: String!
  text: String!
}

type User {
  id: ID! @unique
  name: String!
  createdAt: DateTime!
  updatedAt: DateTime!
  age: Int
}
```

* Redeploy

```bash
prisma deploy
```

```js
* Add a new user

// request

mutation {
  createUser(data: {
    name: "John"
    age: 42
  }) {
    id
    createdAt
    updatedAt
  }
}

//  response

{
  "data": {
    "createUser": {
      "id": "cjfn22toe002m0783jex5ezjo",
      "createdAt": "2018-04-05T21:51:05.000Z",
      "updatedAt": "2018-04-05T21:51:05.000Z"
    }
  }
}
```

* Edit the Post model to include an author field of type `User!`
* Edit the User model to include a posts field of type `[Post!]!`

```js
type Post {
  id: ID! @unique
  isPublished: Boolean! @default(value: false)
  title: String!
  text: String!
  author: User!
}

type User {
  id: ID! @unique
  name: String!
  createdAt: DateTime!
  updatedAt: DateTime!
  age: Int
  posts: [Post!]!
}
```

* Redeploy

```bash
prisma deploy
```

* We can now create a post with an author

```js
// request

mutation {
  createPost(
   data: {
      title: "Post with an author",
      text: "Post text",
      author:{
        connect:{
          id:"cjfn0wup500220783ybt6frab"
        }
      }
    }
  ) {
    id
  }
}

// response

{
  "data": {
    "createPost": {
      "id": "cjfn2xywd003207839o7cymc8"
    }
  }
}
```

* Get all posts with an author

```js
// request
{
  posts(where: {author: {}}) {
    title
    isPublished
    text
    id
    author {
      id
    }
  }
}

// response

{
  posts(where: {author: {}}) {
    title
    isPublished
    text
    id
    author {
      id
    }
  }
}
```

* Create another post for the same author

```js
// request

mutation {
  createPost(
   data: {
      title: "Second post with the same author",
      text: "Post text",
      author:{
        connect:{
          id:"cjfn0wup500220783ybt6frab"
        }
      }
    }
  ) {
    title
    id
    text
    author{
      name
      posts{
        title
      }
    }
  }
}

// response

{
  "data": {
    "createPost": {
      "title": "Second post with the same author",
      "id": "cjfn3gxvk003c07831jerqdp7",
      "text": "Post text",
      "author": {
        "name": "Cheongah",
        "posts": [
          {
            "title": "Post with an author"
          },
          {
            "title": "Second post with the same author"
          }
        ]
      }
    }
  }
}
```

## Configurable Webpack Express/Mongo REST API

w/ TDD

## Configurable Webpack Express/Mongo REST/GraphQL API

w/ TDD

## Notes from [REST & GraphQL API Design in Node.js, v2 (using Express & MongoDB)](https://frontendmasters.com/courses/api-node-rest-graphql/)

### Express

#### Why Express

* Go-to for creating API's with node
* Tons of plugins and integrations
* Declarative routing
* Middleware
* Powerful response options
* DB agnostic
* Highly configurable

#### Simple Example

* Declare an app from express
* Setup basic routing for index route
* Start server on given port

```js
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
```

NOTE: You can use Webpack hot-module reloading to patch changes on the fly instead of restarting the server (nodemon)

#### Routing

* Flexible pattern matching
* Handles parameters
* Multi routing options
* Static & Dynamic config
* Support for all HTTP verbs
* Order based

* Tip: develop a different router for every higher-level feature
* Create a new router from `express.Router()`
* Then pass this as the second argument to `app.use()`, the first being the route

```js
const apiRouter = express.Router();
app.use('/api', apiRouter);
```

* You can chain route methods onto a route with the `.route()` method

```js
user
  .route('/')
  .get(userController.getAll)
  .post(userController.createOne);
```

#### Controllers

* Reuse controllers
* Should be async
* Composable
* Can respond with anything

#### Middleware

* Functions that can be configured to run before the response is sent back
* The back function is called `next`
* Use cases: authentication, enhancing request, logging
* Follows the same signature of `(req, res, next) => {}`
* Inside the middleware, once it's done, call `next()`
* Middleware can be an array of functions
* You can also compose middleware; one middleware can call another middleware that calls another

```js
app.use(
  '/api',
  function(req, res, next) {
    console.log('hi from middleware');
    next();
  },
  restRouter
);
```

* `bodyParser.urlencoded`: formats the query string, so that we can access it on `req.params`
* `bodyParser.json`: anything that is posted or put to the api gets treated like JSON, parsed, and given to us in `req.body`
* JSON web tokens: unique string that's signed on your server, when decoded, turns back into the object that was signed; `expressJwt`

##### Error handling

* The `error` object is the first parameter, as in `(err, req, res, next)=>{}`
* The error handler needs to be at the end; errors bubble up

### CRUD

#### MongoDB

* No-SQL
* Schemaless

##### Mongoose

* The most popular ORM/ODM for Mongo, does provide schemas
* The Mongoose query api is promise-based, has validations, lifecycle hooks, run time join tables (populations)

##### Models

* Import `mongoose`
* Make an object called `schema`
* Make an instance of a new `mongoose.Schema`, passing in the object
* Create a model from that mongoose schema, by passing a model name and the mongoose schema into `mongoose.model`
* Every id in Mongoose is a string
* To make a model field the type of another mongoose model, use `type: mongoose.Schema.Types.ObjectId` as well as a `ref`, with a value of the model name
* There are lifecycle hooks like `pre`, you can run, for example before validation

* Create controllers for each http VERB + route configuration
* Use info from request and middleware to provide details to DB queries and insert: query params, route params, tokens, cookies, ip's
* keep it async
* minimize touching the db
* querying the DB, like `Song.findById(id)`, returns a mongo query object which has a promise on it; this allows you to drill down your query
* if you want the pure promise, call `Song.findById(id).exec()`
* `exec()` means there's no further drilling down, just execute the query
* `const song = await Song.findById(id).exec()`, `Song.findOne({name: "something"}).exec()`
* Create indexes on things that you want to search so that you can look them up faster
* To create an item, `Song.create({})`
* If you use the constructor form `const song = new Song({})`, you need to call `.save()` later, as in `song.save()`
* To update an item, `Song.findOneAndUpdate({name: "old name"}, {name: "new name"}, {new: true})`; or `findByIdAndUpdate`
* The `{new: true}` option is important; it means return the new updated document from this query, and not the old one before the update
* Once you have a document like `song` from `const song = await Song.findById(id).exec()`, you can update it with dot notation as in `song.name="new name"` and then `await song.save()` will write to a document

#### Dynamic config and testing

##### Dynamic config

* Create configs based on environment
* Keep all config in one place
* Use config values in place of hard coded values in your app
* Setup config values on different platforms using env variables
* Mongodb url, port number, auth secret, disable auth option for dev
* Start out with a base config, get your environmental variable for the environment you're going to read from; the standard is `NODE_ENV` in Node, `process.env.NODE_ENV`
* Node code is wrapped in an IIFE function, like: `(function(__dirname, require, __filename, ...., process){}())`
* default to 'Development' if 'NODE_ENV' is not set
* Create a baseConfig, an object with port, secrets, db config
* depending on the env, load up the appropriate config file
* export the merged envConfig ontop of the baseConfig
* Set the `NODE_ENV` in npm scripts, for instance `"start dev": "NODE_ENV=dev webpack"`
* The platfrom where you deploy should always have a place for env variables
* Use `dotenv` package to store secrets in an `env` file and load them during testing

##### Dynamic testing

* For repeatable tests like `GET` all or `UPDATE` one, you can generate them dynamically by wrapping them in a function and using variables; then call the function with the model and any options like `createApiSpec(model, resourceName, newResource)`

### GraphQL

* Gives clients the power to ask for exactly what they need and nothing more (declarative?)
* Can use together with REST API, side by side, underneath, ontop
* Resolvers are like controllers but way more granular
* You don't need version for your api
* Immediate benefit for client side code, for the consumer of the api
* GraphQL uses one route, not based on HTTP verbs, strict data typing, interactive docs, works well with component architecture, advanced data resolving
* One disadvantage: Rest is cacheable on a network level; GraphQL is not

#### Schemas

* For interacting with the api, not the database; it's before the database
* Defines Types, Queries, and Mutations
* Types are like object shapes
* Queries are for Read operations
* Mutations are for Create, Update, and Delete operations
* Easier to write, more flexible, to write all schemas in a GraphQl file and combine them at the end
* You can generate schemas dynamically (advanced)
* Very strict
* Schemas are very composable
* Primative types called scalar types: String, Int, ID, Boolean, Enums
* Whenever you try to resolve a type that is not a scalar, you have to manually create that type; you have to describe the shape of that object
* Describe the shape of any mutation variables in the schema; instead of `type`, use the `input` keyword
* You can use `#` to comment in gql files; these comments will also become documentation in Graphiql
* Inputs will usually have all the same fields, but requirements will be a little different, depending on the requirements of the mutation
* You can set defaults (only on inputs):

```
input NewSong{
  title: String!
  favorite: Boolean = false
}
```

* Better to set defaults on the database than in Graphql
* You can reference another type from a field in a different file; we'll use a tool to compose the schemas:

```
type Playlist{
  id: ID!
  songs: [Song]!
}
```

* There are some plugins that will read your Mongoose schema and generate schemas
* You can also use a function to dynamically generate schemas, but you also need to generate the resolvers

#### Queries and Mutations

* If it's not a scalar, we have to specify what fields we want from that object
* Prepend mutations with the mutation keyword; mutations are named; the convention is to use titlecase; describe the arguments:
* You can only use scalars or inputs in mutation arguments; you can't use types

```
mutation CreateSong($input: NewSong!){
  newSong(input: $input){
     id title url
     }
  }

  // inside Query Variables
  {
    "input": {"title": "title", "url": "http://www.google.com", "artist": "me"}
  }
```

#### GraphQL and Express

* We can reuse express libraries; express does a good job at packaging the request object

```js
// graphQLRouter.js
import { makeExecutableSchema } from 'graphql-tools';
import { userType, userResolvers } from './resources/user';
import merge from 'lodash.merge';
import { graphqlExpress } from 'apollo-server-express';
```

* `graphql-tools` allows us to combine queries and extend mutations, and build schemas in a string format, as opposed to the JS format; it has to convert it to JS for us
* `graphqlExpress` is a middleware that we use to graphql server on an express route; we use it to attach our graphql type definitions and resolvers to our root express application

* Create a baseSchema; at minimum, we need a query; we don't need a mutation

```js
const baseSchema = `
schema {
    query: Query
}
`;
```

* The syntax is just a string; this is the root Query
* Query is a built-in type
* We need to explicitly define it
* Everything will be a child of this root Query

* Assign `makeExecutableSchema()`, passing in an array of our type definitions, and an object of all the resolvers merged together

```js
const schema = makeExecutableSchema({
  // all the graphql files
  typeDefs: [baseSchema, userType],
  // all the resolvers
  resolvers: merge({}, userResolvers)
});
```

* Export `graphqlExpress()` (from apollo-server-express), passing in the request object from Express as a callback; it has the path, headers, everything associated with the incoming request; we want to pass that down to every single Graphql resolver that we have, so that they have access to it
* It returns an object with the executable schema and a `context` object, which is an object that gets passed down to every resolver; we want to pass down the `req` to every one; the `user` here is for the authentication middleware

```js
export const graphQLRouter = graphqlExpress(req => ({
  schema,
  context: {
    req,
    user: req.user
  }
}));
```

* Mount the GrapQL router on the express app at `/graphql`; import and use like any other router
* Create a route for GraphiQL at path `docs`; use `graphiqlExpress` package from apollo-server-express, passing in a config object with the graphql `endpointURL`; this returns a react app; it uses introspection (it's a kind of recursive query); it sends one query to the graphql endpoint which returns everything associated with the graphql api: the types, names, mutations, etc. (This type of introspection query is useful for lots of tools)
* Start the server and go to `/docs`

```js
// add to server.js

import { restRouter, graphQLRouter } from './api';
import { graphiqlExpress } from 'apollo-server-express';

app.use('/graphql', graphQLRouter);
app.use(
  '/docs',
  graphiqlExpress({
    endpointURL: '/graphql'
  })
);
```

* When you return an object from the resolvers, and properties match up with the types in your graphql, graphql takes it from there; if they don't match up, you need to write a resolver for that

#### Resolvers

* Functions to resolve data for schema
* A resolver takes 4 arguments: the `rootValue` (optional - for nested resolvers, or per request caching), then an object of all the arguments for the given resolver, then the `context` object (the request that was coming in), and finally the `info`, which is the raw ast (for advanced use). Args and context are the most commonly used arguments.
* Export the resolver with a `Query` in it; the queries should match the definitions in type Query in the schema
* Nested resolvers: only going to run when someone asks for that field;

```js
// user.graphql
type User {
    id: ID!
    friends: [String]!
    username: String!
}

input UpdatedUser{
    username: String!
}

type Query {
    getMe: User!
}

// user.resolvers.js

const getMe = (rootValue, args, context, info) => {
    return {
        id: 34435435
        username: "Bob"
    }
}

export const userResolvers = {
  Query: {
    getMe
  },
  User: {
    friends: user => {
      // query db for friends of this user
      return ["Amy, Michael"]
    }
  }
};
```

* In subsequent graphql files, when defining `type Query`, use the `extend` keyword
* Import resolvers into graphQLRouter
* Include them in the `merge` function inside of resolvers inside `makeExecutableSchema()`

#### Mutations

* Use whenever you need to make a change to a data source
* POST / PUT / DELETE requests
* Usually takes arguments
* Think about what your clients needs as a response from the result of the input; you are creating something, but you're also asking for something back; at minimum, you need an id and the things you updated, or the whole object
* Can only do one mutation at a time (you can do multiple queries in one request)
* Must have resolvers

* In GraphiQL, use the `mutation` keyword followed by the operation; you give it a variable, prefixed by the `$`, and you have to give it the exact same type as in the mutation

```js
mutation CreateSong($input: NewSong!){
    newSong(input: $input)
}

// query variables
{
    "input": {"title": "Test", "artist": "ArtistName", "url": "http://fakeurl.com"}
}
```

* The process for creating a mutation in graphql is the same as for creating a query, the only difference is how you resolve it
* Define `type Mutation` in one place, and `extend` it in other files
* The mutations resolvers have the same syntax; you're just performing some Create, Update, Delete operation instead of a Read operation

#### Nested Resolvers

Non scalars:

* Custom types
* Objects
* Can be used wherever scalar types are used
* Must be resolved eventually

Nested resolvers:

* Used to create the "graph" in your api
* take the parent branch as the root value
* only executed when the query asks for it
* Add console.log to trace

```js
export const playlistResolvers = {
  Query: {
    allPlaylists,
    Playlist: getPlaylist
  },

  Mutation: {
    newPlaylist,
    updatePlaylist
  },

  // example
  Playlist: {
    async songs(playlist) {
      console.log('getting songs');
      const populated = await playlist.populate('songs').execPopulate();

      return populated.songs;
    }
  }
};
```

#### Protecting Resolvers and Testing

* Move the functionality from global middleware to a per-resolver basis
* Authenticate on every resolver
* Testing: we don't have to run a server, don't have to go through express
* Test pure graphql: execute query and inspect response and DB activity
* Use the raw graphql library: `import {graphql} from 'graphql'`

```js
export const runQuery = async (query, variables, user) => {
  return graphql(schema, query, {}, { user }, variables);
};
```

* With this one function that returns a promise, we can execute our entire schema without a server; it returns a promise and resolves the values
* Include `beforeEach` and `afterEach` to `dropDb()` each time
* Just pass in a query, exactly the same as you would in graphiql, but as a string to `runQuery`, and you get back an object just like you would in graphiql

```js
describe('User', () => {
  let user;
  beforeEach(async () => {
    await dropDb();
    user = await User.create({ username: 'stu1', passwordHash: '123' });
  });

  afterEach(async () => {
    await dropDb();
  });

  it('should get me', async () => {
    const result = await runQuery(
      `
      {
        getMe {
          id
          username
        }
      }
    `,
      {},
      user
    );

    expect(result.errors).to.not.exist;
    expect(result.data.getMe).to.be.an('object');
    expect(result.data.getMe.id).to.eql(user.id.toString());
  });
});
```

#### Rest and GraphQL

* REST next to GraphQL
* Convert REST to GraphQL: take incoming REST request and create a query on the fly; run query against graphql schema
