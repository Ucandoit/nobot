import express from 'express';
import cardService from './card-service';

export default async (): Promise<void> => {
  const app = express();

  app.get('/start', async (req, res) => {
    res.status(200).send('Card');
  });

  app.get('/tradeNp', async (req, res) => {
    const { source, target } = req.query;
    cardService.tradeNp(source as string, target as string);
    res.status(200).send();
  });

  app.listen(3000);
};
