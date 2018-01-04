const Koa = require('koa');
const config = require('config');
const session = require('koa-session');
const log = require('./src/lib/log');
const koaLogger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const globalError = require('./src/middleware/globalError');
const { router, authRouter } = require('./src/routes');

const app = new Koa();

app.keys = [config.sessionSecretKey];

app.use(globalError());
app.use(koaLogger());
app.use(session(app));
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

app.listen(config.listenPort);
log.info(`Server listen at port ${config.listenPort}`);

process.on('uncaughtException', (err) => {
  log.error(err);
  // do something to notice admin...
  process.exit(1);
});
