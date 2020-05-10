import express from 'express';
import auctionService from './auction/auction-service';

export default (): void => {
  const app = express();

  app.get('/start', async (req, res) => {
    const { login } = req.query;
    auctionService.startSniping(login as string);
    res.status(200).send();
  });

  app.get('/stop', async (req, res) => {
    const { login } = req.query;
    auctionService.stopSniping(login as string);
    res.status(200).send();
  });

  app.get('/start/all', async (req, res) => {
    auctionService.startAll();
    res.status(200).send();
  });

  app.get('/stop/all', async (req, res) => {
    auctionService.stopAll();
    res.status(200).send();
  });

  app.listen(3000);
};
