const Router = require('koa-router');
const userAuth = require('../middleware/userAuth');
const userRoutes = require('./user');
const planetRoutes = require('./planet');
const auctionRoutes = require('./auction');

const router = new Router();
const authRouter = new Router();

router.post('/users', userRoutes.register);
router.post('/users/login', userRoutes.login);
router.get('/users/:walletAddr', userRoutes.getUserInfo);
router.get('/planets', planetRoutes.getPlanets);
router.get('/planets/:planetNo', planetRoutes.getPlanetInfo);
router.get('/auctions/:auctionId', auctionRoutes.getAuctionInfo);

authRouter.use(userAuth());

authRouter.patch('/users', userRoutes.updateUserInfo);
authRouter.post('/users/logout', userRoutes.logout);
authRouter.get('/users/my-info', userRoutes.getMyInfo);
authRouter.patch('/planets', planetRoutes.customPlanetInfo);
authRouter.post('/planets/discover', planetRoutes.discoverPlanetByAdmin);
authRouter.post('/auctions', auctionRoutes.createAuction);
authRouter.post('/auctions/buy', auctionRoutes.buyPlanet);
authRouter.delete('/auctions', auctionRoutes.cancelAuction);

module.exports = { router, authRouter };
