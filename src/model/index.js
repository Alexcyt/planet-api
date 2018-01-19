const { dbConfig } = require('config');
const knex = require('knex')(dbConfig);
const bookshelf = require('bookshelf')(knex);

bookshelf.plugin('pagination');
/* eslint-disable */

var User = bookshelf.Model.extend({
  tableName: 'user',
  planets() {
    return this.hasMany(Planet);
  }
});

var Planet = bookshelf.Model.extend({
  tableName: 'planet',
  user() {
    return this.belongsTo(User);
  },
  auction() {
    return this.hasOne(Auction);
  }
});

var Auction = bookshelf.Model.extend({
  tableName: 'auction',
  planet() {
    return this.belongsTo(Planet);
  },
  seller() {
    return this.belongsTo(User).through(Planet, 'planet_id', 'user_id');
  }
});

module.exports = { bookshelf, User, Planet, Auction };
