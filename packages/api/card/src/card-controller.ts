import { Controller, RequestMapping } from '@nobot-core/commons';
import { Card } from '@nobot-core/database';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import CardService from './card-service';

@Controller('/cards')
export default class CardController {
  @inject(CardService) cardService: CardService;

  @RequestMapping('/')
  async getAll(req: Request, res: Response): Promise<void> {
    const { page, size, sort, order, filters } = req.query;
    const cards = await this.cardService.getAll(
      parseInt(page as string, 10),
      parseInt(size as string, 10),
      sort as keyof Card,
      order as 'ASC' | 'DESC',
      JSON.parse(filters as string)
    );
    res.status(200).send(cards);
  }

  @RequestMapping('/:cardId')
  async getOne(req: Request, res: Response): Promise<void> {
    const { cardId } = req.params;
    const { login } = req.query;
    const card = await this.cardService.getCardDetail(cardId, login as string);
    res.status(200).send(card);
  }

  @RequestMapping('/scan/account')
  scanAllAccountCards(req: Request, res: Response): void {
    this.cardService.scanAllAccountCards();
    res.status(200).send();
  }

  @RequestMapping('/tradeNp')
  tradeNp(req: Request, res: Response): void {
    const { source, target } = req.query;
    this.cardService.tradeNp(source as string, target as string);
    res.status(200).send();
  }
}
