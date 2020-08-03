import { Controller, HttpStatus, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import AccountService from './account-service';

@Controller('/action/account')
export default class AccountController {
  @inject(AccountService) accountService: AccountService;

  @RequestMapping('/login')
  dailyLoginAll(req: Request, res: Response): void {
    this.accountService.dailyLoginAll();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/login/:login')
  async dailyLogin(req: Request, res: Response): Promise<void> {
    const { login } = req.params;
    await this.accountService.dailyLogin(login);
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/comeback')
  comeback(req: Request, res: Response): void {
    this.accountService.comebackAll();
    res.status(HttpStatus.OK).send();
  }
}
