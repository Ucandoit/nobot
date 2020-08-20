import { Controller } from '@nobot-core/commons';
import { inject } from 'inversify';
import TerritoryBattleService from './territory-battle-service';

@Controller('/event/territoryBattle')
export default class TerritoryBattleController {
  @inject(TerritoryBattleService) territoryBattleService: TerritoryBattleService;

  // @RequestMapping('/start')
  // startAll(req: Request, res: Response): void {
  //   this.territoryBattleService.startAll();
  //   res.status(HttpStatus.OK).send();
  // }

  // @RequestMapping('/stop')
  // stopAll(req: Request, res: Response): void {
  //   this.territoryBattleService.stopAll();
  //   res.status(HttpStatus.OK).send();
  // }
}
