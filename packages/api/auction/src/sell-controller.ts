import { Controller, HttpMethod, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import SellService from './sell-service';

@Controller('/auction/sell')
export default class SellController {
  @inject(SellService) sellService: SellService;

  @RequestMapping('/', [HttpMethod.POST])
  async sellCard(req: Request, res: Response): Promise<void> {
    const { login, cardId, sellPrice } = req.query;
    await this.sellService.sell(login as string, parseInt(cardId as string, 10), parseInt(sellPrice as string, 10));
    res.status(200).send();
  }

  @RequestMapping('/status')
  async getSellStates(req: Request, res: Response): Promise<void> {
    res.status(200).send(await this.sellService.getSellStates());
  }

  @RequestMapping('/status/check')
  async checkSellStates(req: Request, res: Response): Promise<void> {
    await this.sellService.checkSellStates();
    res.status(200).send();
  }
}
