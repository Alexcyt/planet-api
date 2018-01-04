const bunyan = require('bunyan');

module.exports = bunyan.createLogger({
  name: 'planet-api',
  level: process.env.NODE_ENV === 'production' ? bunyan.INFO : bunyan.DEBUG,
});
