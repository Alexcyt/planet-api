const RETCODE = require('../constant/retCode');
const log = require('../lib/log');

function globalError() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (e) {
      log.error(e);
      ctx.body = Object.assign({}, RETCODE.SERVER_ERROR, { errStack: e.stack });
    }
  };
}

module.exports = globalError;
