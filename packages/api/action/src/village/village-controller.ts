import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import VillageService from './village-service';

@Controller('/action/village')
export default class VillageController {
  @inject(VillageService) villageService: VillageService;

  @RequestMapping('/:login')
  async dailyLogin(req: Request, res: Response): Promise<void> {
    res.status(200).send(await this.villageService.getVillage(req.params.login));
  }
}
