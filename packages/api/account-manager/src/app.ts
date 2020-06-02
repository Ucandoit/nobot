import express from 'express';
import accountService from './account.service';
import accountInfoService from './account-info.service';

export default async (): Promise<void> => {
  const app = express();

  app.get('/accounts', async (req, res) => {
    res.status(200).send(await accountService.getAll());
  });

  app.get('/refine/quest', async (req, res) => {
    const { login } = req.query;
    accountService.refineQuest(login as string);
    res.status(200).send();
  });

  app.get('/accounts/:login/reserveCards', async (req, res) => {
    const { login } = req.params;
    res.status(200).send(await accountInfoService.getReserveCards(login as string));
  });

  app.listen(3000);
};
