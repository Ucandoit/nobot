import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import SkillScanService from './skill-scan-service';

@Controller('/cards/skills')
export default class SkillScanController {
  @inject(SkillScanService) skillScanService: SkillScanService;

  @RequestMapping('/update')
  async updateScan(req: Request, res: Response): Promise<void> {
    await this.skillScanService.scan();
    res.status(200).send();
  }
}
