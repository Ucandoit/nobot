import { Controller, getQueryParamAsInt, getQueryParamAsString, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import WarService from './war-service';

@Controller('/event/war')
export default class WarController {
  @inject(WarService) warService: WarService;

  @RequestMapping('/start/all')
  startAll(req: Request, res: Response): void {
    this.warService.startAll();
    res.status(200).send();
  }

  @RequestMapping('/stop/all')
  stopAll(req: Request, res: Response): void {
    this.warService.stopAll();
    res.status(200).send();
  }

  @RequestMapping('/start')
  start(req: Request, res: Response): void {
    const group = getQueryParamAsString(req, 'group');
    if (group) {
      this.warService.startByGroup(group);
    }
    res.status(200).send();
  }

  @RequestMapping('/field')
  goToWarField(req: Request, res: Response): void {
    const group = getQueryParamAsString(req, 'group');
    const warFieldId = getQueryParamAsInt(req, 'warFieldId');
    if (group && warFieldId) {
      this.warService.goToWarFieldByGroup(group, warFieldId);
    }
    // TODO: complete quest by login
    res.status(200).send();
  }

  @RequestMapping('/host')
  chooseWarHost(req: Request, res: Response): void {
    const group = getQueryParamAsString(req, 'group');
    const countryId = getQueryParamAsInt(req, 'countryId');
    if (group && countryId) {
      this.warService.chooseWarHostByGroup(group, countryId);
    }
    // TODO: complete quest by login
    res.status(200).send();
  }

  @RequestMapping('/completePreQuests')
  completePreQuests(req: Request, res: Response): void {
    const group = getQueryParamAsString(req, 'group');
    if (group) {
      this.warService.completePreQuestsByGroup(group);
    }
    // TODO: complete quest by login
    res.status(200).send();
  }

  @RequestMapping('/completeWarQuests')
  completeWarQuests(req: Request, res: Response): void {
    const group = getQueryParamAsString(req, 'group');
    if (group) {
      this.warService.completeWarQuestsByGroup(group);
    }
    // TODO: complete quest by login
    res.status(200).send();
  }
}
