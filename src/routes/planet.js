const RETCODE = require('../constant/retCode');
const CONSTANT = require('../constant/common');
const model = require('../model/index');

const { Planet } = model;

async function getPlanets(ctx) {
  const params = ctx.params;
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const forSale = params.for_sale || false;
  const search = params.search ? params.search.trim() : '';
  let orderDirection = 'desc';
  if (params.order_direction === 'asc') {
    orderDirection = 'asc';
  }

  const queryFunc = qb => {
    if (forSale) {
      qb.innerJoin('auction', 'planet.id', 'auction.planet_id');
    }

    let hasMoreWhere = false;
    if (params.wallet_addr) {
      qb.innerJoin('user', 'planet.user_id', 'user.id')
        .where('user.wallet_addr', '=', params.wallet_addr);
      hasMoreWhere = true;
    }

    if (search) {
      let tmpQuery = 'where MATCH(planet.planet_no, planet.english_name, planet.chinese_name, planet.custom_name)'
        + ' AGAINST(? in NATURAL LANGUAGE MODE)';
      if (hasMoreWhere) {
        tmpQuery = `and ${tmpQuery}`;
      }
      qb.raw(tmpQuery, [search]);
    }
  };

  const results = await Planet
    .query(queryFunc)
    .orderBy('create_time', orderDirection)
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
        startPrice: auction.get('start_price'),
        endPrice: auction.get('end_price'),
        createTime: auction.get('create_time'),
        duration: auction.get('duration')
      };
    }

    planets.push({
      id: planet.get('id'),
      planetNo: planet.get('planet_no'),
      englishName: planet.get('english_name'),
      chineseName: planet.get('chinese_name'),
      customName: planet.get('custom_name'),
      img: planet.get('img'),
      createTime: planet.get('create_time'),
      owner: {
        nickName: user.get('nick_name'),
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

}

async function customPlanetInfo(ctx) {

}

module.exports = {
  getPlanets,
  getPlanetInfo,
  customPlanetInfo
};
