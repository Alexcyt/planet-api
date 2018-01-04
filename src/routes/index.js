const Router = require('koa-router');
const userAuth = require('../middleware/userAuth');
const userRoutes = require('./user');

const router = new Router();
const authRouter = new Router();

router.post('/users', userRoutes.register);
router.post('/users/login', userRoutes.login);
router.get('/users/:walletAddr', userRoutes.getUserInfo);

authRouter.use(userAuth());

authRouter.patch('/users', userRoutes.updateUserInfo);
authRouter.post('/users/logout', userRoutes.logout);
authRouter.get('/users/my-info', userRoutes.getMyInfo);

module.exports = { router, authRouter };
