import express from 'express';
import sellService from './sell-service';

export default async (): Promise<void> => {
  const app = express();

  app.post('/auction/sell', async (req, res) => {
    const { login, cardId, sellPrice } = req.query;
    await sellService.sell(login as string, parseInt(cardId as string, 10), parseInt(sellPrice as string, 10));
    res.status(200).send();
  });

  app.get('/auction/sell/status', async (req, res) => {
    res.status(200).send(await sellService.getSellStates());
  });

  app.get('/auction/sell/status/check', async (req, res) => {
    await sellService.checkSellStates();
    res.status(200).send();
  });

  app.listen(3000);
};
