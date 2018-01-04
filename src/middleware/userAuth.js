const RETCODE = require('../constant/retCode');

function userAuth() {
  return async (ctx, next) => {
    const curUser = ctx.session.curUser;
    if (!curUser || !curUser.id) {
      ctx.body = RETCODE.UNAUTHORIZED;
      return;
    }

    await next();
  };
}

module.exports = userAuth;
