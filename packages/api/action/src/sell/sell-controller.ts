import { Controller, HttpMethod, HttpStatus, RequestMapping } from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import Joi from 'joi';
import { getLogger } from 'log4js';
import SellService from './sell-service';

@Controller('/action/sell')
export default class SellController {
  private logger = getLogger(SellController.name);

  @inject(SellService) sellService: SellService;

  @RequestMapping('/stored', [HttpMethod.POST])
  async sellStoredCard(req: Request, res: Response): Promise<void> {
    const schema = Joi.object({
      login: Joi.string().required(),
      fileId: Joi.string().required(),
      cardIndex: Joi.string().required(),
      price: Joi.number().required().positive(),
      term: Joi.number().optional().valid(1, 2)
    });
    const {
      value: { login, fileId, cardIndex, price, term },
      error
    } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      this.logger.error(error.message);
      res.status(HttpStatus.BAD_REQUEST).send({ error: error.message });
    } else {
      try {
        res.status(200).send(await this.sellService.sellStoredCard(login, fileId, cardIndex, price, term));
      } catch (err) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
      }
    }
  }
}
