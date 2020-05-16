import express from 'express';
import accountService from './account-service';

export default async (): Promise<void> => {
  const app = express();

  app.get('/refine/quest', async (req, res) => {
    const { login } = req.query;
    accountService.refineQuest(login as string);
    res.status(200).send();
  });

  app.listen(3000);
};
