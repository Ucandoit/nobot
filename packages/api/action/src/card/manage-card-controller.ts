import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import ManageCardService from './manage-card-service';

@Controller('/action/card')
export default class ManageCardController {
  @inject(ManageCardService) manageCardService: ManageCardService;

  @RequestMapping('/moveSample')
  async moveSample(req: Request, res: Response): Promise<void> {
    this.manageCardService.moveSampleCard();
    res.status(200).send();
  }

  @RequestMapping('/deckSample')
  async deckSample(req: Request, res: Response): Promise<void> {
    this.manageCardService.moveSampleCard();
    res.status(200).send();
  }

  @RequestMapping('/learnSkillSample')
  async learnSkillSample(req: Request, res: Response): Promise<void> {
    this.manageCardService.learnSkillSample();
    res.status(200).send();
  }
}
