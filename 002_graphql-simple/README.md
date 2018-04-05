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
