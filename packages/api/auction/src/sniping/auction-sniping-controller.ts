import { Controller, HttpStatus, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import AuctionSnipingService from './auction-sniping-service';

@Controller('/auction/sniping')
export default class AuctionSnipingController {
  @inject(AuctionSnipingService) auctionSnipingService: AuctionSnipingService;

  @RequestMapping('/start/all')
  async startAll(req: Request, res: Response): Promise<void> {
    await this.auctionSnipingService.startAll();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/stop/all')
  stopAll(req: Request, res: Response): void {
    this.auctionSnipingService.stopAll();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/start')
  start(req: Request, res: Response): void {
    const { login } = req.query;
    this.auctionSnipingService.startSniping(login as string);
    res.status(200).send();
  }

  @RequestMapping('/stop')
  stop(req: Request, res: Response): void {
    const { login } = req.query;
    this.auctionSnipingService.stopSniping(login as string);
    res.status(200).send();
  }
}
