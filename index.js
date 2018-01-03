const Koa = require('koa');
const config = require('config');
const Router = require('koa-router');
const session = require('koa-session');
const log = require('./lib/log');
const koaLogger = require('koa-logger');

const app = new Koa();
const router = new Router();

app.keys = [config.sessionSecretKey];

app.use(koaLogger());
app.use(session(app));

router.get('/', async (ctx) => {
  let n = ctx.session.views || 0;
  ++n;
  ctx.session.views = n;
  ctx.body = `${n} views`;
});

router.get('/logout', async ctx => {
  ctx.session = null;
  ctx.body = 'Goodbye';
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(config.listenPort);
log.info(`Server listen at port ${config.listenPort}`);
