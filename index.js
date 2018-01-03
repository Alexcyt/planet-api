const Koa = require('koa');
const app = new Koa();
const config = require('config');

app.use(ctx => {
  ctx.body = 'Hello Koa';
});

app.listen(config.listenPort);