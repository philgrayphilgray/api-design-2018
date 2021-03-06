## Simple Express/Mongo REST API 001_express_mongo

## Simple GraphQL API with Prisma 002_graphql-simple

* Following tutorials on the Prisma site

## GraphQL API with Prisma 003_graphql-album-collector

* Create a simple GraphQL API that can be consumed by the album-collector app
* At this point, we're not implementing authentication or permissions
* We need a `User` type and an `Album` type
* The `User` type will just have a `username` and an `id`
* The `Album` type will have an `id`, `title`, `artist`, `art`, `year`, and `rating`, consistent with the existing front-end; perhaps also an `owner`
* We should also add an `Artist` type so we can relate albums to artists and not just owners

### Bootstrap the Project with Prisma

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

### Create the models

```js
// Boilerplate Post type not shown here; to be removed later

type Album {
  id: ID! @unique
  title: String!
  artist: Artist!
  art: String!
  year: String!
  rating: Int!
  owner: User!
}

type Artist {
  id: ID! @unique
  name: String!
  works: [Album!]!
}

type User {
  id: ID! @unique
  username: String! @unique
  collection: [Album!]!
}
```

* Re-deploy. Prisma will auto-generate CRUD operations for the model in the db server.

```js
prisma deploy
```

* Start the dev server and test the DB server

```bash
cd <project name>
yarn dev
```

* Create a User in Playground

```js
// request

mutation{
  createUser(data:{
    username:"demouser"
  }){
    username
    id
  }
}

// response

{
  "data": {
    "createUser": {
      "username": "demouser",
      "id": "cjfn7utjq0013076922n515h7"
    }
  }
}
```

* Create an Artist

```js
// request

mutation{
  createArtist(data:{
    name: "Sun Ra"
  }){
    name
    id
  }
}

// response

{
  "data": {
    "createArtist": {
      "name": "Sun Ra",
      "id": "cjfn815li001b0769jy2ext7z"
    }
  }
}
```

* Copy id's from the first user and first artist
* Create an Album (using the copied fields)
* Get back some fields to see how its populating with other types

```js
// request

mutation {
  createAlbum(data: {title: "Space is the Place", artist: {connect: {id: "cjfn815li001b0769jy2ext7z"}}, art: "https://upload.wikimedia.org/wikipedia/en/6/6c/Space_Is_The_Place_album_cover.jpg", year: "1973", rating: 5, owner: {connect: {id: "cjfn7utjq0013076922n515h7"}}}) {
    title
    artist {
      name
      works {
        title
      }
    }
    owner {
      username
      collection {
        title
      }
    }
  }
}


// response

{
  "data": {
    "createAlbum": {
      "title": "Space is the Place",
      "artist": {
        "name": "Sun Ra",
        "works": [
          {
            "title": "Space is the Place"
          }
        ]
      },
      "owner": {
        "username": "demouser",
        "collection": [
          {
            "title": "Space is the Place"
          }
        ]
      }
    }
  }
}
```

### Update app schema and write resolvers

* Update the schema

```js
// irrelevant boilerplate removed from the example

# import Album from "./generated/prisma.graphql"
# import Artist from "./generated/prisma.graphql"
# import User from "./generated/prisma.graphql"

type Query {
  user(id: ID!): User
  users: [User!]!
  artist(id: ID!): Artist
  artists: [Artist!]!
  album(id: ID!): Album
  albums: [Album!]!
}

type Mutation {
  createArtist(name: String!): Artist
  createUser(username: String!): User
  createAlbum(
    title: String!
    artist: String!
    art: String!
    year: String!
    rating: Int!
    owner: String!
  ): Album
}

// note the artist and owner above are strings, expecting the id, not the object itself in this case
```

* Update the resolvers

```js
// inside index.js; irrelevant boilerplate removed

const resolvers = {
  Query: {
    user(parent, { id }, ctx, info) {
      return ctx.db.query.user({ where: { id } }, info);
    },
    users(parent, args, ctx, info) {
      return ctx.db.query.users({}, info);
    },
    artist(parent, { id }, ctx, info) {
      return ctx.db.query.artist({ where: { id }, info });
    },
    artists(parent, args, ctx, info) {
      return ctx.db.query.artists({}, info);
    },
    album(parent, { id }, ctx, info) {
      return ctx.db.query.album({ where: { id }, info });
    },
    albums(parent, args, ctx, info) {
      return ctx.db.query.albums({}, info);
    }
  },
  Mutation: {
    createArtist(parent, { name }, ctx, info) {
      return ctx.db.mutation.createArtist({
        data: {
          name
        }
      });
    },
    createUser(parent, { username }, ctx, info) {
      return ctx.db.mutation.createUser({
        data: {
          username
        }
      });
    },
    createAlbum(
      parent,
      { title, artist, art, year, rating, owner },
      ctx,
      info
    ) {
      return ctx.db.mutation.createAlbum({
        data: {
          title,
          artist: { connect: { id: artist } },
          art,
          year,
          rating,
          owner: { connect: { id: owner } }
        }
      });
    }
  }
};
```

* Note above in the `createAlbum` mutation that we need to mimic the db connect for artist and owner; another option is to use resolver forwarding

* Create an album from the app

```js
// request

mutation {
  createAlbum(title: "Lanquidity", artist: "cjfn815li001b0769jy2ext7z", art: "https://upload.wikimedia.org/wikipedia/en/2/22/Lanquidity.jpg", year: "1978", rating: 4, owner: "cjfnbyiqb001t0769191it5pq") {
    title
    id
  }
}

// response

{
  "data": {
    "createAlbum": {
      "title": "Lanquidity",
      "id": "cjfnd0u4t00230769n7n3c1gl"
    }
  }
}
```

* To make this work with the actual app, we need to expect that the user will provide an artist name and not the id; we also need to be able to handle both cases when the artist already exists or doesn't exist.

* We should be able to achieve this with `upsert`; however this is not possible at this time as `upsert` is only available inside an update mutation, not a create mutation
* The workaround Prisma provided is to perform and if/else check in the query resolver; if the artist exists, connect to it; otherwise create it: [Nested upsert in create mutations](https://github.com/graphcool/prisma/issues/2194)

```js
// inside index.js resolvers.Mutation object

    async createAlbum(parent, { artist, owner, ...args }, ctx, info) {
      const artistExists = await ctx.db.exists.Artist({
        name: artist
      });
      if (!artistExists) {
        return ctx.db.mutation.createAlbum(
          {
            data: {
              ...args,
              artist: { create: { name: artist } },
              owner: { connect: { id: owner } }
            }
          },
          info
        );
      } else {
        return ctx.db.mutation.createAlbum(
          {
            data: {
              ...args,
              artist: { connect: { name: artist } },
              owner: { connect: { id: owner } }
            }
          },
          info
        );
      }
    }
```

* Now, when a user adds an album with a particular artist name, we will later be able to query by that artist name and see all the albums associated with that particular artist.
* One caveat here is that different users could add the same album and now the artist will have duplicate records.
* So, we might want to implement a kind of master copy for the album, which doesn't have as many fields -- just a title and an artist and an array of all the user instances of that album, so we can do things like averaging user ratings; this way, we can display a public page of all the albums in the db, and underneath that (if we choose), all the users who own that album and what their rating is; and other users can add it to their collection
* To implement this, we need to create a new model and then perform the same kind of if/else checking whenever we create an album instance; if the master album doesn't exist, create it first; I don't want to change everywhere I've written the word album, so let's just call this new model `Master`
* The `Artist` model will also need to be updated so that it's works point to `Master` and not `Album`
* The updated datamodel will look something like this:

```js
type Album {
  id: ID! @unique
  title: String!
  artist: Artist!
  art: String!
  year: String!
  rating: Int!
  owner: User!
}

type Master{
  id: ID! @unique
  title: String!
  artist: Artist!
  art: String!
  year: String!
  rating: Int!
  copies: [Album!]!
}

type Artist {
  id: ID! @unique
  name: String! @unique
  works: [Master!]!
}

type User {
  id: ID! @unique
  username: String! @unique
  collection: [Album!]!
}
```

* In implementing this, we create an additional if/else check in the createAlbum mutation resolver

```js
// inside index.js resolvers.Mutation object

async createAlbum(parent, { artist, owner, ...args }, ctx, info) {
      const artistExists = await ctx.db.exists.Artist({
        name: artist
      });

      if (!artistExists) {
        return ctx.db.mutation.createAlbum(
          {
            data: {
              ...args,
              artist: { create: { name: artist } },
              owner: { connect: { id: owner } },
              master: { create: { title: args.title } }
            }
          },
          info
        );
      } else {
        const masterExists = await ctx.db.exists.Master({
          title: args.title
        });

        if (!masterExists) {
          return ctx.db.mutation.createAlbum(
            {
              data: {
                ...args,
                artist: { connect: { name: artist } },
                owner: { connect: { id: owner } },
                master: {
                  create: { artist: { connect: { name: artist } }, ...args }
                }
              }
            },
            info
          );
        } else {
          return ctx.db.mutation.createAlbum(
            {
              data: {
                ...args,
                artist: { connect: { name: artist } },
                owner: { connect: { id: owner } },
                master: { connect: { title: args.title } }
              }
            },
            info
          );
        }
      }
    }
```

* The first user to create an album sets the defaults for the master. We can later add access for any user to update to any field of the master, similar to how users on Wikipedia can update content that is outdated or inaccurate.

### Remove boilerplate models, schema, and resolvers

* Remove boilerplate resolvers from `index.js`
* Remove boilerplate schema from `schema.graphql`
* Restart the dev server; verify there are no errors
* Remove boilerplate models from `datamodel.graphql`
* Redeploy; restart the dev server; verify there are no errors

### Lock down user collections with permissions

## GraphQL with Authentication API with Prisma 004_graphql-auth

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
