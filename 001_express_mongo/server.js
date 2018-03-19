const http = require('http');
const app = require('./app');
const { mongoose, databaseUrl, options } = require('./database');

const port = process.env.PORT || 3000;

const server = http.createServer(app);

mongoose.connect(databaseUrl, options).then(() => {
  server.listen(port);
});
