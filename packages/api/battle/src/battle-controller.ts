import { Controller } from '@nobot-core/commons';
import { inject } from 'inversify';
import BattleService from './battle-service';

@Controller('/battle')
export default class BattleController {
  @inject(BattleService) battleService: BattleService;

  // @RequestMapping('/start')
  // startAll(req: Request, res: Response): void {
  //   this.buildingService.startAll();
  //   res.status(200).send();
  // }

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

  // @RequestMapping('/check')
  // checkNeedBuilding(req: Request, res: Response): void {
  //   this.buildingService.checkNeedBuilding();
  //   res.status(200).send();
  // }
}
