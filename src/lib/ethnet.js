const Web3 = require('web3');
const config = require('config');
const planetCoreSource = require('../../build/contracts/PlanetCore.json');
const saleAuctionSource = require('../../build/contracts/SaleClockAuction.json');

const { admin, ethereumNet } = config;
const { provider, contract } = ethereumNet;
const { planetCoreAddr, saleClockAuctionAddr } = contract;

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(provider));
const planetCoreInstance = new web3.eth.Contract(planetCoreSource.abi, planetCoreAddr);
const saleAuctionInstance = new web3.eth.Contract(saleAuctionSource.abi, saleClockAuctionAddr);

module.exports = {
  web3,
  planetCoreInstance,
  saleAuctionInstance,
  planetCoreAddr,
  saleClockAuctionAddr,
  admin,
  gasLimit: 6e6
};
