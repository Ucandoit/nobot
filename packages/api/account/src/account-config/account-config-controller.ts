import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import AccountConfigService from './account-config-service';

@Controller('/accounts/config')
export default class AccountConfigController {
  @inject(AccountConfigService) accountConfigService: AccountConfigService;

  @RequestMapping('/initialize')
  async initialize(req: Request, res: Response): Promise<void> {
    await this.accountConfigService.initializeAccountConfigs();
    res.status(200).send();
  }
}
