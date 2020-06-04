import { Card } from '@nobot-core/database';
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

  app.post('/cards/:cardId/sell', async (req, res) => {
    const { cardId } = req.params;
    const { login, sellPrice } = req.query;
    await cardService.sell(login as string, cardId, parseInt(sellPrice as string, 10));
    res.status(200).send();
  });

  app.get('/cards/:cardId', async (req, res) => {
    const { cardId } = req.params;
    const { login } = req.query;
    const card = await cardService.getCardDetail(cardId, login as string);
    res.status(200).send(card);
  });

  app.get('/cards', async (req, res) => {
    const { page, size, sort, order } = req.query;
    res
      .status(200)
      .send(
        await cardService.getAll(
          parseInt(page as string, 10),
          parseInt(size as string, 10),
          sort as keyof Card,
          order as 'ASC' | 'DESC'
        )
      );
  });

  // cardService.scanAccountCards('ucandoit');
  // cardService.getRewardCard(1652);

  app.listen(3000);
};
