import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import CardScanService from './card-scan-service';

@Controller('/cards/scan')
export default class CardController {
  @inject(CardScanService) cardScanService: CardScanService;

  @RequestMapping('/update')
  async updateScan(req: Request, res: Response): Promise<void> {
    await this.cardScanService.scan();
    res.status(200).send();
  }
}
