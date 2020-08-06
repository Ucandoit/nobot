import { Controller, getQueryParamAsInt, getQueryParamAsString, HttpStatus, RequestMapping } from '@nobot-core/commons';
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
