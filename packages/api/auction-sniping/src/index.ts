import { redisClient } from '@nobot-core/commons';
import initConnection from '@nobot-core/database';
import express from 'express';
import { configure } from 'log4js';

configure({
  appenders: {
    out: { type: 'stdout' }
  },
  categories: { default: { appenders: ['out'], level: 'info' } },
  disableClustering: true
});

initConnection().then(() => {
  const app = express();

  redisClient.start();

  app.get('/', async (req, res) => {
    res.send(`Hello World`);
  });

  app.get('/start', async (req, res) => {
    const { login } = req.query;
    if (login) {
      const token = await redisClient.get(`token-${login}`);
      console.log(token);
    }
    res.send('OK');
  });

  app.listen(3000);
});
