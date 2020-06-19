import { Controller, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import StoryService from './story-service';

@Controller('/story')
export default class StoryController {
  @inject(StoryService) storyService: StoryService;

  @RequestMapping('/startAll')
  async startAll(req: Request, res: Response): Promise<void> {
    this.storyService.start('');
    // console.log(await this.storyService.getDeckFood('ucandoit'));
    // const { login, cardId, sellPrice } = req.query;
    // await this.storyService.sell(login as string, parseInt(cardId as string, 10), parseInt(sellPrice as string, 10));
    res.status(200).send();
  }

  @RequestMapping('/start/:login')
  async start(req: Request, res: Response): Promise<void> {
    const extraTicket = req.query.ticket ? parseInt(req.query.ticket as string, 10) : undefined;
    this.storyService.start(req.params.login, extraTicket);
    res.status(200).send();
  }

  @RequestMapping('/stop/:login')
  async stop(req: Request, res: Response): Promise<void> {
    this.storyService.stop(req.params.login);
    res.status(200).send();
  }

  @RequestMapping('/status/:login')
  async status(req: Request, res: Response): Promise<void> {
    res.status(200).send({
      status: await this.storyService.getStatus(req.params.login)
    });
  }

  // @RequestMapping('/status')
  // async getSellStates(req: Request, res: Response): Promise<void> {
  //   const page = getQueryParamAsInt(req, 'page');
  //   const size = getQueryParamAsInt(req, 'size');
  //   const sort = getQueryParamAsString(req, 'sort');
  //   const order = getQueryParamAsString(req, 'order');
  //   const filters = req.query.filters !== undefined ? JSON.parse(req.query.filters as string) : undefined;
  //   const sellStates = await this.storyService.getSellStates(page, size, sort, order as 'ASC' | 'DESC', filters);
  //   res.status(200).send(sellStates);
  // }

  // @RequestMapping('/status/check')
  // async checkSellStates(req: Request, res: Response): Promise<void> {
  //   await this.storyService.checkSellStates();
  //   res.status(200).send();
  // }
}
