import {
  Controller,
  getQueryParamAsInt,
  getQueryParamAsString,
  HttpException,
  HttpStatus,
  RequestMapping
} from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import WarConfigService from './war-config-service';

@Controller('/event/war/configs')
export default class WarController {
  @inject(WarConfigService) warConfigService: WarConfigService;

  @RequestMapping('/initialize')
  initialize(req: Request, res: Response): void {
    this.warConfigService.initializeWarConfigs();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/warFields')
  async getWarFields(req: Request, res: Response): Promise<void> {
    try {
      await this.warConfigService.checkWarByLogin('zzz_001');
      const warFields = await this.warConfigService.getWarFields();
      res.status(HttpStatus.OK).send(warFields);
    } catch (e) {
      if (e instanceof HttpException) {
        res.status(e.getStatus()).send(e.getMessage());
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
      }
    }
  }

  // TODO: change method to post
  @RequestMapping('/line')
  startAll(req: Request, res: Response): void {
    const line = getQueryParamAsInt(req, 'line') as number;
    const group = getQueryParamAsString(req, 'group');
    if (group) {
      this.warConfigService.setLineByGroup(line, group);
    } else {
      // TODO: set line by login
    }
    res.status(HttpStatus.OK).send();
  }
}
