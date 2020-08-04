import { Controller, getQueryParamAsString, HttpStatus, RequestMapping } from '@nobot-core/commons';
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

  @RequestMapping('/recruit')
  recruit(req: Request, res: Response): void {
    const recruiter = getQueryParamAsString(req, 'recruiter') as string;
    const candidate = getQueryParamAsString(req, 'candidate') as string;
    this.accountService.recruit(recruiter, candidate);
    res.status(HttpStatus.OK).send();
  }
}
