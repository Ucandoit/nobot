import express from 'express';
import auctionService from './auction/auction-service';

export default (): void => {
  const app = express();

  app.get('/', async (req, res) => {
    res.send(`Hello World`);
  });

  app.get('/start', async (req, res) => {
    const { login } = req.query;
    auctionService.startSniping(login as string);
    res.send('OK');
  });

  app.get('/start/all', async (req, res) => {
    auctionService.startAll();
    res.send('OK');
  });

  // auctionService.startAll();

  app.listen(3000);
};
