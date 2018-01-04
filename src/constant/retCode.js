module.exports = {
  SUCCESS: {
    retCode: 0,
    msg: 'success',
  },
  SERVER_ERROR: {
    retCode: 40001,
    msg: 'internal server error',
  },
  BAD_REQUEST: {
    retCode: 40002,
    msg: 'invalid request body params',
  },
  DUPLICATED_USER: {
    retCode: 40003,
    msg: 'the wallet address already exists',
  },
  UNAUTHORIZED: {
    retCode: 40004,
    msg: 'unauthorized operation',
  },
  NOT_FOUND: {
    retCode: 40005,
  },
};
