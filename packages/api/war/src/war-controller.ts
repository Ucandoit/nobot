import { Controller, getQueryParamAsString, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import WarService from './war-service';

@Controller('/war')
export default class WarController {
  @inject(WarService) warService: WarService;

  @RequestMapping('/startAll')
  startAll(req: Request, res: Response): void {
    this.warService.startAll();
    res.status(200).send();
  }

  @RequestMapping('/stopAll')
  stopAll(req: Request, res: Response): void {
    this.warService.stopAll();
    res.status(200).send();
  }

  @RequestMapping('/start/:login')
  start(req: Request, res: Response): void {
    const { login } = req.params;
    this.warService.start(login);
    res.status(200).send();
  }

  @RequestMapping('/stop/:login')
  stop(req: Request, res: Response): void {
    const { login } = req.params;
    this.warService.stop(login);
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
