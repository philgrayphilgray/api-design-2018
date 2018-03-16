Notes from [REST & GraphQL API Design in Node.js, v2 (using Express & MongoDB)](https://frontendmasters.com/courses/api-node-rest-graphql/)

## Express

### Why Express

* Go-to for creating API's with node
* Tons of plugins and integrations
* Declarative routing
* Middleware
* Powerful response options
* DB agnostic
* Highly configurable

### Simple Example

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

### Routing

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

### Controllers

* Reuse controllers
* Should be async
* Composable
* Can respond with anything

### Middleware

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

#### Error handling

* The `error` object is the first parameter, as in `(err, req, res, next)=>{}`
* The error handler needs to be at the end; errors bubble up

## CRUD

### MongoDB

* No-SQL
* Schemaless

#### Mongoose

* The most popular ORM/ODM for Mongo, does provide schemas
* The Mongoose query api is promise-based, has validations, lifecycle hooks, run time join tables (populations)

#### Models

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

### Dynamic config and testing

#### Dynamic config

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

#### Dynamic testing

* For repeatable tests like `GET` all or `UPDATE` one, you can generate them dynamically by wrapping them in a function and using variables; then call the function with the model and any options like `createApiSpec(model, resourceName, newResource)`

## GraphQL

* Gives clients the power to ask for exactly what they need and nothing more (declarative?)
* Can use together with REST API, side by side, underneath, ontop
* Resolvers are like controllers but way more granular
* You don't need version for your api
* Immediate benefit for client side code, for the consumer of the api
* GraphQL uses one route, not based on HTTP verbs, strict data typing, interactive docs, works well with component architecture, advanced data resolving
* One disadvantage: Rest is cacheable on a network level; GraphQL is not

### Schemas

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

### Queries and Mutations

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

### GraphQL and Express

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
