const { GraphQLServer } = require('graphql-yoga');
const { Prisma } = require('prisma-binding');

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
    },
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

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: req => ({
    ...req,
    db: new Prisma({
      typeDefs: 'src/generated/prisma.graphql',
      endpoint: 'http://localhost:4466/album-collector-api/dev', // the endpoint of the Prisma DB service
      secret: 'mysecret123', // specified in database/prisma.yml
      debug: true // log all GraphQL queryies & mutations
    })
  })
});

server.start(() => console.log('Server is running on http://localhost:4000'));
