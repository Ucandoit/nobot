import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import AuctionSnipingService from './auction-sniping-service';

@Controller('/auction/sniping')
export default class AuctionSnipingController {
  @inject(AuctionSnipingService) auctionSnipingService: AuctionSnipingService;

  @RequestMapping('/start/all')
  async startAll(req: Request, res: Response): Promise<void> {
    await this.auctionSnipingService.startAll();
    res.status(200).send();
  }
}
