const config = require('config');

const { truffleNet } = config.ethereumNet;

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: truffleNet
  }
};
