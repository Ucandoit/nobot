import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import RewardService from './reward-service';

@Controller('/action/reward')
export default class RewardController {
  @inject(RewardService) rewardService: RewardService;

  @RequestMapping('/itembox')
  async getAllItemboxReward(req: Request, res: Response): Promise<void> {
    await this.rewardService.getAllItemboxReward();
    res.status(200).send();
  }
}
