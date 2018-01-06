const RETCODE = require('../constant/retCode');
// const CONSTANT = require('../constant/common');
const model = require('../model/index');

const { Auction, Planet } = model;

async function createAuction(ctx) {
  const params = ctx.request.body;
  if (typeof params.planetId !== 'number' || Number.isNaN(params.planetId)
    || typeof params.startPrice !== 'number' || Number.isNaN(params.startPrice)
    || typeof params.endPrice !== 'number' || Number.isNaN(params.endPrice)
    || typeof params.duration !== 'number' || Number.isNaN(params.duration)) {
    ctx.body = RETCODE.BAD_REQUEST;
    return;
  }

  const curUser = ctx.session.curUser;
  const planet = new Planet({ id: params.planetId, user_id: curUser.user_id }).fetch({ withRelated: 'auction' });
  if (!planet || planet.related('auction').get('id')) {
    ctx.body = RETCODE.UNAUTHORIZED;
    return;
  }

  const auction = await new Auction({
    planet_id: params.planetId,
    start_price: params.startPrice,
    end_price: params.endPrice,
    duration: params.duration
  }).save();

  ctx.body = Object.assign({}, RETCODE.SUCCESS, {
    data: {
      auctionId: auction.get('id')
    }
  });
}

async function getAuctionInfo(ctx) {
  const params = ctx.params;
  if (typeof params.auctionId !== 'string' || !params.auctionId.match(/^\d+$/g)) {
    ctx.body = RETCODE.BAD_REQUEST;
    return;
  }

  const auctionId = Number.parseInt(params.auctionId, 10);
  const auction = await new Auction({ id: auctionId }).fetch();
  if (!auction) {
    ctx.body = Object.assign({}, RETCODE.NOT_FOUND, { msg: 'Auction does not exist' });
    return;
  }

  ctx.body = Object.assign({}, RETCODE.SUCCESS, {
    data: {
      id: auction.get('id'),
      startPrice: auction.get('start_price'),
      endPrice: auction.get('end_price'),
      createTime: auction.get('create_time'),
      duration: auction.get('duration')
    }
  });
}

// TODO 需要向以太网询问交易是否完成——检查所买星球是否已经属于自己
async function buyPlanet(ctx) {
  const params = ctx.request.body;
  if (!typeof params.auctionId !== 'number' || Number.isNaN(params.auctionId)) {
    ctx.body = RETCODE.BAD_REQUEST;
    return;
  }

  const auction = await new Auction({ id: params.auctionId }).fetch({ withRelated: 'planet' });
  if (!auction) {
    ctx.body = Object.assign({}, RETCODE.NOT_FOUND, { msg: 'Auction does not exist' });
    return;
  }

  // 访问合约，检测交易是否完成。。。

  const curUser = ctx.session.curUser;
  const planet = auction.related('planet');
  await [
    planet.save({ user_id: curUser.id }, { patch: true }),
    auction.destroy()
  ];

  ctx.body = RETCODE.SUCCESS;
}

module.exports = {
  createAuction,
  getAuctionInfo,
  buyPlanet
};
