import { Controller, HttpMethod, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import AccountInfoService from './account-info-service';
import AccountService from './account-service';

@Controller('/accounts')
export default class CardController {
  @inject(AccountService) accountService: AccountService;

  @inject(AccountInfoService) accountInfoService: AccountInfoService;

  @RequestMapping('/')
  async getAll(req: Request, res: Response): Promise<void> {
    res.status(200).send(await this.accountService.getAll());
  }

  @RequestMapping('/lastMobile')
  async getLastMobileAccount(req: Request, res: Response): Promise<void> {
    const account = await this.accountService.getLastMobileAccount();
    res.status(200).send(account);
  }

  @RequestMapping('/create', [HttpMethod.POST])
  async create(req: Request, res: Response): Promise<void> {
    const account = await this.accountService.create(req.body);
    res.status(201).send(account);
  }

  @RequestMapping('/:login/reserveCards')
  async getReserveCards(req: Request, res: Response): Promise<void> {
    const { login } = req.params;
    res.status(200).send(await this.accountInfoService.getReserveCards(login as string));
  }

  @RequestMapping('/refine/quest')
  refineQuest(req: Request, res: Response): void {
    const { login } = req.query;
    this.accountService.refineQuest(login as string);
    res.status(200).send();
  }
}
