import { Controller } from '@nobot-core/commons';
import { inject } from 'inversify';
import WarService from './war-service';

@Controller('/war')
export default class WarController {
  @inject(WarService) warService: WarService;

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
