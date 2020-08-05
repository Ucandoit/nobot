import { Controller, HttpStatus, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import CountryBattleService from './country-battle-service';

@Controller('/event/countryBattle')
export default class CountryBattleController {
  @inject(CountryBattleService) countryBattleService: CountryBattleService;

  @RequestMapping('/start/all')
  startAll(req: Request, res: Response): void {
    this.countryBattleService.startAll();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/stop/all')
  stopAll(req: Request, res: Response): void {
    this.countryBattleService.stopAll();
    res.status(HttpStatus.OK).send();
  }
}
