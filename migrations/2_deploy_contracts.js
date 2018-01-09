const PlanetCore = artifacts.require("PlanetCore");
const SaleClockAuction = artifacts.require("SaleClockAuction");
const Promise = require('bluebird');
const writeFile = Promise.promisify(require('fs').writeFile);

const NODE_ENV = process.env.NODE_ENV;
let configPath = null;

if (NODE_ENV !== 'production') {
  configPath = `${__dirname}/../config/default.json`;
} else {
  configPath = `${__dirname}/../config/production.json`;
}

const config = require(configPath);

module.exports = function (deployer) {
  deployer.deploy(PlanetCore)
    .then(function () {
      return deployer.deploy(SaleClockAuction, PlanetCore.address, 10);
    })
    .then(function () {
      config.ethereumNet.contract = {
        planetCoreAddr: PlanetCore.address,
        saleClockAuctionAddr: SaleClockAuction.address
      };
      return writeFile(configPath, JSON.stringify(config, null, 2));
    });
};