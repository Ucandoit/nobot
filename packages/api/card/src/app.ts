import express from 'express';
import cardService from './card-service';

export default (): void => {
  const app = express();

  app.get('/start', async (req, res) => {
    res.status(200).send('Card');
  });

  cardService.scanStoredCards('xzdykerik');

  app.listen(3000);
};
