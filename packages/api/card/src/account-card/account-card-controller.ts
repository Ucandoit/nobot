import { Controller, getQueryParamAsString, HttpMethod, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import AccountCardService from './account-card-service';

@Controller('/cards/account')
export default class AccountCardController {
  @inject(AccountCardService) accountCardService: AccountCardService;

  @RequestMapping('/')
  async getAccountCards(req: Request, res: Response): Promise<void> {
    const login = getQueryParamAsString(req, 'login');
    if (login) {
      res.status(200).send(await this.accountCardService.getAccountCards(login));
    } else {
      // TODO: implement get all account cards by filter
      res.status(200).send();
    }
  }

  @RequestMapping('/scan', [HttpMethod.GET, HttpMethod.POST])
  scanAllAccountCards(req: Request, res: Response): void {
    const login = getQueryParamAsString(req, 'login');
    if (login) {
      this.accountCardService.scanAccountCards(login);
    } else {
      this.accountCardService.scanAllAccountCards();
    }
    res.status(200).send();
  }
}
