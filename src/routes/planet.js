const RETCODE = require('../constant/retCode');
const CONSTANT = require('../constant/common');
const model = require('../model/index');
const Promise = require('bluebird');
const ethnet = require('../lib/ethnet');
const log = require('../lib/log');
const schedule = require('node-schedule');
const config = require('config');

const {
  Planet,
  User,
  Auction,
  bookshelf
} = model;
const { USER_TYPE } = CONSTANT;
const {
  web3,
  planetCoreInstance,
  saleAuctionInstance,
  gasLimit,
  admin
} = ethnet;

async function getPlanets(ctx) {
  const params = ctx.request.query;
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const forSale = params.forSale === 'true';
  const search = params.search ? params.search.trim() : '';
  let orderDirection = 'desc';
  if (params.order_direction === 'asc') {
    orderDirection = 'asc';
  }

  const queryFunc = (qb) => {
    if (forSale) {
      qb.innerJoin('auction', 'planet.id', 'auction.planet_id');
    }

    qb.whereNotNull('user_id');
    if (params.walletAddr) {
      qb.innerJoin('user', 'planet.user_id', 'user.id')
        .andWhere('user.wallet_addr', '=', params.walletAddr);
    }

    if (search) {
      qb.andWhere((qb2) => {
        qb2.where('planet.planet_no', 'like', `${search}%`)
          .orWhere('planet.english_name', 'like', `${search}%`)
          .orWhere('planet.chinese_name', 'like', `${search}%`)
          .orWhere('planet.custom_name', 'like', `${search}%`);
      });
    }
  };

  const results = await Planet
    .query(queryFunc)
    .orderBy('discover_time', orderDirection)
    .fetchPage({
      page,
      pageSize,
      withRelated: ['user', 'auction']
    });

  const { pagination } = results;
  const planets = [];
  for (const planet of results.models) {
    const user = planet.related('user');
    const auction = planet.related('auction');
    let sale = null;
    if (auction.get('id')) {
      sale = {
        id: auction.get('id'),
        startPrice: auction.get('start_price'),
        endPrice: auction.get('end_price'),
        createTime: auction.get('create_time'),
        duration: auction.get('duration')
      };
    }

    planets.push({
      id: planet.get('id'),
      planetNo: planet.get('planet_no'),
      location: planet.get('location'),
      englishName: planet.get('english_name'),
      chineseName: planet.get('chinese_name'),
      customName: planet.get('custom_name'),
      officialIntro: planet.get('official_intro'),
      customIntro: planet.get('custom_intro'),
      img: planet.get('img'),
      discoverTime: planet.get('discover_time'),
      owner: {
        nickName: user.get('nick_name'),
        headImg: user.get('head_img'),
        walletAddr: user.get('wallet_addr')
      },
      auction: sale
    });
  }

  ctx.body = Object.assign({}, RETCODE.SUCCESS, {
    data: {
      pagination,
      planets
    }
  });
}

async function getPlanetInfo(ctx) {
  const params = ctx.params;
  if (typeof params.planetNo !== 'string' || !params.planetNo.match(/^\d+$/g)) {
    ctx.body = RETCODE.BAD_REQUEST;
    return;
  }

  const planetNo = params.planetNo;
  const planet = await Planet.query((qb) => {
    qb.whereNotNull('user_id').andWhere('planet_no', '=', planetNo);
  }).fetch({ withRelated: ['user', 'auction'] });
  if (!planet) {
    ctx.body = Object.assign({}, RETCODE.NOT_FOUND, { msg: 'planet doex not exist' });
    return;
  }

  const user = planet.related('user');
  const auction = planet.related('auction');
  let sale = null;
  if (auction.get('id')) {
    sale = {
      id: auction.get('id'),
      startPrice: auction.get('start_price'),
      endPrice: auction.get('end_price'),
      createTime: auction.get('create_time'),
      duration: auction.get('duration')
    };
  }

  ctx.body = Object.assign({}, RETCODE.SUCCESS, {
    data: {
      id: planet.get('id'),
      planetNo: planet.get('planet_no'),
      location: planet.get('location'),
      englishName: planet.get('english_name'),
      chineseName: planet.get('chinese_name'),
      customName: planet.get('custom_name'),
      officialIntro: planet.get('official_intro'),
      customIntro: planet.get('custom_intro'),
      img: planet.get('img'),
      discoverTime: planet.get('discover_time'),
      owner: {
        nickName: user.get('nick_name'),
        walletAddr: user.get('wallet_addr'),
        headImg: user.get('head_img')
      },
      auction: sale
    }
  });
}

async function customPlanetInfo(ctx) {
  const params = ctx.request.body;
  if (typeof params.planetId !== 'number' || Number.isNaN(params.planetId)
    || (!params.customName && !params.customIntro)) {
    ctx.body = RETCODE.BAD_REQUEST;
    return;
  }

  const curUser = ctx.session.curUser;
  const planet = await new Planet({ id: params.planetId, user_id: curUser.id }).fetch();
  if (!planet) {
    ctx.body = RETCODE.UNAUTHORIZED;
    return;
  }

  const info = {};
  if (typeof params.customName === 'string' && params.customName) {
    info.custom_name = params.customName;
  }
  if (typeof params.customIntro === 'string' && params.customIntro) {
    info.custom_intro = params.customIntro;
  }

  await planet.save(info, { patch: true });

  ctx.body = RETCODE.SUCCESS;
}

async function discoverPlanet(planet) {
  await web3.eth.personal.unlockAccount(admin.walletAddr, admin.password, 300);
  let resp = await planetCoreInstance.methods.discoverPlanetAndAuction(planet.get('location')).send({
    from: admin.walletAddr,
    gas: gasLimit
  });
  log.debug(resp);

  const respEvents = resp.events;
  if (!respEvents || !respEvents.Discover || !respEvents.Transfer) {
    throw new Error('discover planet transaction on ethereum error');
  }

  const planetNo = respEvents.Discover.returnValues.planetId;
  resp = await saleAuctionInstance.methods.getAuction(planetNo).call();
  log.debug(resp);
  const auctionInfo = {
    planet_id: planet.get('id'),
    start_price: resp.startingPrice,
    end_price: resp.endingPrice,
    duration: Number.parseInt(resp.duration, 10),
    create_time: new Date(Number.parseInt(resp.startedAt, 10) * 1000)
  };

  const [_, auction] = await bookshelf.transaction(t =>  // eslint-disable-line
    Promise.all([
      planet.save({
        user_id: admin.id,
        planet_no: planetNo.toString(),
        discover_time: new Date(),
      }, { patch: true, transacting: t }),
      new Auction(auctionInfo).save(null, { transacting: t })
    ]));

  return {
    planetId: planet.get('id'),
    auctionId: auction.get('id')
  };
}

async function discoverPlanetByAdmin(ctx) {
  const curUser = ctx.curUser;
  const tmpUser = await new User({ id: curUser.id }).fetch();
  if (!tmpUser || tmpUser.get('type') !== USER_TYPE.ADMIN || tmpUser.walletAddr !== admin.walletAddr) {
    ctx.body = RETCODE.UNAUTHORIZED;
    return;
  }

  const params = ctx.request.body;
  let planet = null;
  if (typeof params.planetId !== 'number' || Number.isNaN(params.planetId)) {
    planet = await Planet.query((qb) => {
      qb.whereNull('user_id').orderByRaw('RAND()');
    }).fetch();
  } else {
    const planetId = Number.parseInt(params.planetId, 10);
    planet = await Planet.query((qb) => {
      qb.whereNull('user_id').andWhere('id', '=', planetId);
    }).fetch();
  }

  if (!planet) {
    ctx.body = Object.assign({}, RETCODE.NOT_FOUND, { msg: 'There does not have new planet' });
    return;
  }

  let data = null;
  try {
    data = await discoverPlanet(planet);
  } catch (err) {
    ctx.body = Object.assign({}, RETCODE.ETHEREUM_ERROR, { msg: err.msg });
    return;
  }

  ctx.body = Object.assign({}, RETCODE.SUCCESS, { data });
}

async function discoverPlanetAuto() {
  try {
    const planet = await Planet.query((qb) => {
      qb.whereNull('user_id').orderByRaw('RAND()');
    }).fetch();

    if (!planet) {
      throw new Error('There does not have new planet');
    }

    await discoverPlanet(planet);
  } catch (err) {
    log.error(err);
  }
}

setTimeout(() => {
  schedule.scheduleJob(`*/${config.discoverIntervel} * * * *`, discoverPlanetAuto);
}, 10000);

module.exports = {
  getPlanets,
  getPlanetInfo,
  customPlanetInfo,
  discoverPlanetByAdmin
};
