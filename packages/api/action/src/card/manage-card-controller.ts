import {
  Controller,
  getQueryParamAsBoolean,
  getQueryParamAsInt,
  getQueryParamAsString,
  HttpStatus,
  RequestMapping
} from '@nobot-core/commons';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import { getLogger } from 'log4js';
import ManageCardService from './manage-card-service';

@Controller('/action/card')
export default class ManageCardController {
  private logger = getLogger(ManageCardController.name);

  @inject(ManageCardService) manageCardService: ManageCardService;

  @RequestMapping('/moveSample')
  async moveSample(req: Request, res: Response): Promise<void> {
    await this.manageCardService.moveSampleCard();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/deckSample')
  async deckSample(req: Request, res: Response): Promise<void> {
    const login = getQueryParamAsString(req, 'login');
    if (login) {
      await this.manageCardService.manageDeck(login);
    } else {
      await this.manageCardService.manageSampleDeck();
    }
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/moveCard')
  async moveCard(req: Request, res: Response): Promise<void> {
    const login = getQueryParamAsString(req, 'login');
    const cardId = getQueryParamAsInt(req, 'cardId');
    if (login && cardId) {
      await this.manageCardService.moveCard(login, cardId);
      res.status(HttpStatus.OK).send();
    } else {
      this.logger.error('Error while moving card %d for %s.', cardId, login);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  }

  @RequestMapping('/learnSkillSample')
  async learnSkillSample(req: Request, res: Response): Promise<void> {
    this.manageCardService.learnSkillSample();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/refineQuest')
  async refineQuest(req: Request, res: Response): Promise<void> {
    this.manageCardService.refineQuest();
    res.status(HttpStatus.OK).send();
  }

  @RequestMapping('/toggleFavorite')
  async toggleFavorite(req: Request, res: Response): Promise<void> {
    try {
      const login = getQueryParamAsString(req, 'login');
      const cardId = getQueryParamAsString(req, 'cardId');
      const favorite = getQueryParamAsBoolean(req, 'favorite');
      if (login && cardId) {
        await this.manageCardService.toggleFavorite(login, cardId, favorite);
        res.status(HttpStatus.OK).send();
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
      }
    } catch (err) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    }
  }
}
