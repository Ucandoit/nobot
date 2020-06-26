import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import BuildingService from './building-service';

@Controller('/action/build')
export default class BuildingController {
  @inject(BuildingService) buildingService: BuildingService;

  @RequestMapping('/start')
  startAll(req: Request, res: Response): void {
    this.buildingService.startAll();
    res.status(200).send();
  }

  @RequestMapping('/start/:login')
  start(req: Request, res: Response): void {
    const { login } = req.params;
    this.buildingService.start(login);
    res.status(200).send();
  }
}
