import {
  Controller,
  getQueryParamAsInt,
  getQueryParamAsString,
  HttpException,
  HttpMethod,
  HttpStatus,
  RequestMapping
} from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import AccountConfigService from './account-config-service';

@Controller('/accounts/configs')
export default class AccountConfigController {
  @inject(AccountConfigService) accountConfigService: AccountConfigService;

  @RequestMapping('/')
  async getAll(req: Request, res: Response): Promise<void> {
    const page = getQueryParamAsInt(req, 'page');
    const size = getQueryParamAsInt(req, 'size');
    const sort = getQueryParamAsString(req, 'sort');
    const order = getQueryParamAsString(req, 'order');
    const filters = req.query.filters !== undefined ? JSON.parse(req.query.filters as string) : undefined;
    const accountConfigs = await this.accountConfigService.getAccountConfigs(
      page,
      size,
      sort,
      order as 'ASC' | 'DESC',
      filters
    );
    res.status(HttpStatus.OK).send(accountConfigs);
  }

  @RequestMapping('/initialize')
  async initialize(req: Request, res: Response): Promise<void> {
    await this.accountConfigService.initializeAccountConfigs();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/:login', [HttpMethod.PATCH])
  async patch(req: Request, res: Response): Promise<void> {
    try {
      const { login } = req.params;
      const accountConfig = await this.accountConfigService.patchAccountConfig(login, req.body);
      res.status(HttpStatus.OK).send(accountConfig);
    } catch (e) {
      if (e instanceof HttpException) {
        res.status(e.getStatus()).send(e.getMessage());
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
      }
    }
  }
}
