import { Controller, HttpStatus, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import BattleService from './battle-service';

@Controller('/battle')
export default class BattleController {
  @inject(BattleService) battleService: BattleService;

  @RequestMapping('/start/all')
  startAll(req: Request, res: Response): void {
    this.battleService.startAll();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/stop/all')
  stopAll(req: Request, res: Response): void {
    this.battleService.stopAll();
    res.status(HttpStatus.OK).send();
  }

  // @RequestMapping('/start/:login')
  // start(req: Request, res: Response): void {
  //   const { login } = req.params;
  //   this.buildingService.start(login);
  //   res.status(200).send();
  // }

  // @RequestMapping('/status')
  // status(req: Request, res: Response): void {
  //   res.status(200).send(this.buildingService.status());
  // }

  @RequestMapping('/check')
  checkBattleStatus(req: Request, res: Response): void {
    this.battleService.checkBattleStatus();
    res.status(200).send();
  }
}
