import express from 'express';
import accountService from './account.service';
import accountInfoService from './account-info.service';

export default async (): Promise<void> => {
  const app = express();

  app.get('/refine/quest', async (req, res) => {
    const { login } = req.query;
    accountService.refineQuest(login as string);
    res.status(200).send();
  });

  app.get('account/info', async (req, res) => {
    const { login } = req.query;
    res.status(200).send(accountInfoService.getReserveCards(login as string));
  });

  app.listen(3000);
};
