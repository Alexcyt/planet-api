const { dbConfig } = require('config');
const knex = require('knex')(dbConfig);
const bookshelf = require('bookshelf')(knex);

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
  }
});

module.export = { bookshelf, User, Planet };
