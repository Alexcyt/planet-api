const RETCODE = require('../constant/retCode');
const CONSTANT = require('../constant/common');
const model = require('../model/index');

const { User } = model;
const { USER_TYPE } = CONSTANT;

async function register(ctx) {
  const params = ctx.request.body;
  if (
    typeof params.walletAddr !== 'string'
    || typeof params.email !== 'string'
    || typeof params.nickName !== 'string'
  ) {
    ctx.body = RETCODE.BAD_REQUEST;
    return;
  }

  const tmpUser = await new User({ wallet_addr: params.walletAddr }).fetch();
  if (tmpUser) {
    ctx.body = RETCODE.DUPLICATED_USER;
    return;
  }

  const user = await new User({
    wallet_addr: params.walletAddr,
    nick_name: params.nickName,
    email: params.email,
    type: USER_TYPE.ORDINARY,
  }).save();

  ctx.session.curUser = {
    id: user.get('id'),
    walletAddr: user.get('wallet_addr'),
    nickName: user.get('nick_name'),
    email: user.get('email'),
    headImg: user.get('head_img'),
    type: user.get('type'),
  };
  ctx.body = RETCODE.SUCCESS;
}

async function updateUserInfo(ctx) {
  const params = ctx.request.body;
  if (typeof params.email !== 'string' && typeof params.nickName !== 'string') {
    ctx.body = RETCODE.BAD_REQUEST;
    return;
  }

  const info = {};
  if (typeof params.email === 'string') {
    info.email = params.email;
  }
  if (typeof params.nickName === 'string') {
    info.nick_name = params.nickName;
  }

  const curUser = ctx.session.curUser;
  const user = await new User({ id: curUser.id }).save(info, { patch: true });
  curUser.nickName = user.get('nick_name');
  curUser.email = user.get('email');

  ctx.body = RETCODE.SUCCESS;
}

async function login(ctx) {
  const params = ctx.request.body;
  if (typeof params.walletAddr !== 'string') {
    ctx.body = RETCODE.BAD_REQUEST;
    return;
  }

  const user = await new User({ wallet_addr: params.walletAddr }).fetch();
  if (!user) {
    ctx.body = Object.assign({}, RETCODE.NOT_FOUND, { msg: 'wallet address does not exist' });
    return;
  }

  ctx.session.curUser = {
    id: user.get('id'),
    walletAddr: user.get('wallet_addr'),
    nickName: user.get('nick_name'),
    email: user.get('email'),
    headImg: user.get('head_img'),
    type: user.get('type')
  };
  ctx.body = RETCODE.SUCCESS;
}

async function logout(ctx) {
  ctx.session = null;
  ctx.body = RETCODE.SUCCESS;
}

async function getUserInfo(ctx) {
  const params = ctx.params;
  if (typeof params.walletAddr !== 'string') {
    ctx.body = RETCODE.BAD_REQUEST;
    return;
  }

  const user = await new User({ wallet_addr: params.walletAddr }).fetch();
  if (!user) {
    ctx.body = Object.assign({}, RETCODE.NOT_FOUND, { msg: 'wallet address does not exist' });
    return;
  }

  ctx.body = Object.assign({}, RETCODE.SUCCESS, {
    data: {
      walletAddr: user.get('wallet_addr'),
      nickName: user.get('nick_name'),
      headImg: user.get('head_img')
    }
  });
}

async function getMyInfo(ctx) {
  ctx.body = ctx.session.curUser;
}

module.exports = {
  register,
  updateUserInfo,
  login,
  logout,
  getUserInfo,
  getMyInfo
};