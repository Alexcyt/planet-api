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

async function init() {
  const { walletAddr, password } = admin;
  await web3.eth.personal.unlockAccount(walletAddr, password, 300);
  const isPaused = await planetCoreInstance.methods.paused().call();
  if (isPaused) {
    await planetCoreInstance.methods
      .setSaleAuctionAddress(saleClockAuctionAddr).send({ from: walletAddr });
    await planetCoreInstance.methods.unpause().send({ from: walletAddr });
  }
}

init();

module.exports = {
  web3,
  planetCoreInstance,
  saleAuctionInstance,
  planetCoreAddr,
  saleClockAuctionAddr,
  admin,
  gasLimit: 1e6 // 测试值较大，以后要改小
};
