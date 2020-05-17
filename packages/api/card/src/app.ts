import express from 'express';

export default (): void => {
  const app = express();

  app.get('/start', async (req, res) => {
    res.status(200).send('Card');
  });

  // cardService.scanStoredCards('xzdykerik');

  app.listen(3000);
};
