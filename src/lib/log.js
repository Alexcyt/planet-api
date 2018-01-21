const bunyan = require('bunyan');
const PrettyStream = require('bunyan-prettystream');

const prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

module.exports = bunyan.createLogger({
  name: 'planet-api',
  streams: [{
    level: process.env.NODE_ENV === 'production' ? bunyan.INFO : bunyan.DEBUG,
    type: 'raw',
    stream: prettyStdOut
  }]
});
