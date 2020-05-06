import { redisClient } from '@nobot-core/commons';
import initConnection from '@nobot-core/database';
import express from 'express';
import { configure } from 'log4js';
import auctionService from './auction/auction-service';

configure({
  appenders: {
    out: { type: 'stdout' }
  },
  categories: { default: { appenders: ['out'], level: 'info' } },
  disableClustering: true
});

// const logger = getLogger('auction-sniping-index');

initConnection().then(() => {
  const app = express();

  redisClient.start();

  app.get('/', async (req, res) => {
    res.send(`Hello World`);
  });

  app.get('/start', async (req, res) => {
    const { login } = req.query;
    auctionService.startSniping(login as string);
    res.send('OK');
  });

  // auctionService.startSniping('xzdykerik');

  app.listen(3000);
});
