const { GraphQLServer } = require('graphql-yoga');
const { Prisma } = require('prisma-binding');

const resolvers = {
  Query: {
    user(parent, { id }, ctx, info) {
      return ctx.db.query.user({ where: { id } }, info);
    },
    users(parent, args, ctx, info) {
      return ctx.db.query.users({}, info);
    },
    artist(parent, { name }, ctx, info) {
      return ctx.db.query.artist({ where: { name } }, info);
    },
    artists(parent, args, ctx, info) {
      return ctx.db.query.artists({}, info);
    },
    album(parent, { id }, ctx, info) {
      return ctx.db.query.album({ where: { id }, info });
    },
    albums(parent, args, ctx, info) {
      return ctx.db.query.albums({}, info);
    },
    master(parent, { title, artist }, ctx, info) {
      return ctx.db.query.master({ where: { id, title }, info });
    },
    masters(parent, args, ctx, info) {
      return ctx.db.query.masters({}, info);
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
