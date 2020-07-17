import { Controller, RequestMapping } from '@nobot-core/commons';
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
}
