import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import TrainingService from './training-service';

@Controller('/action/training')
export default class VillageController {
  @inject(TrainingService) trainingService: TrainingService;

  @RequestMapping('/sample')
  async trainingSample(req: Request, res: Response): Promise<void> {
    this.trainingService.trainingSample();
    res.status(200).send();
  }

  @RequestMapping('/cancelSample')
  async cancelSample(req: Request, res: Response): Promise<void> {
    this.trainingService.cancelSample();
    res.status(200).send();
  }
}
