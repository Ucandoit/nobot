import { executeConcurrent, makePostMobileRequest, NOBOT_MOBILE_URL, Service } from '@nobot-core/commons';
import { Card, CardRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';
import { getMilitary, getProperty, getRarity, getStar, imagesToCost, imagesToNumber } from '../card-utils';

@Service()
export default class CardScanService {
  private logger = getLogger(CardScanService.name);

  private cardRepository: CardRepository;

  constructor(connection: Connection) {
    this.cardRepository = connection.getCustomRepository(CardRepository);
  }

  scan = async (): Promise<void> => {
    const completeCardIds = (await this.cardRepository.getCompleteCardIds()).map((c) => c.id);
    const scanCardIds = [];
    for (let i = 1; i < 2200; i++) {
      if (!completeCardIds.includes(i)) {
        scanCardIds.push(i);
      }
    }
    await executeConcurrent(
      scanCardIds,
      async (cardId: number) => {
        await this.checkCardBook(cardId, 'zz0001');
      },
      10
    );
  };

  checkCardBook = async (cardId: number, login: string): Promise<void> => {
    this.logger.info('Check card book of %d.', cardId);
    const page = await makePostMobileRequest(
      NOBOT_MOBILE_URL.BOOKS_DETAIL,
      login,
      `cardid=${cardId}&showMax=1&isBook=0`
    );
    if (page('.card').length > 0) {
      const newCard = this.htmlToCard(page);
      const card = await this.cardRepository.findOne(cardId);
      if (card) {
        this.logger.info('Update card %d.', cardId);
        await this.cardRepository.update(cardId, newCard);
      } else {
        this.logger.info('Create card %d.', cardId);
        await this.cardRepository.save({
          ...newCard,
          id: cardId,
          number: 9999
        });
      }
    } else {
      this.logger.info('Card book %d does not existe.', cardId);
    }
  };

  private htmlToCard = (page: CheerioStatic): Partial<Card> => {
    return {
      name: page('.card-name').text(),
      realName: page('.card-real-name').text(),
      rarity: getRarity(page('.card-rarity').attr('src')),
      property: getProperty(page('.card-property').attr('src')),
      cost: imagesToCost(
        page('.card-cost img')
          .map((i, img) => img.attribs.src)
          .get()
      ),
      military: getMilitary(page('.card-military').attr('src')),
      job: page('.card-job').text(),
      star: getStar(page('.card-rarity').attr('src')),
      illustUrl: page('.card-illust').attr('src'),
      initialAtk: imagesToNumber(
        page('.card-ability-atk img')
          .map((i, img) => img.attribs.src)
          .get()
      ),
      initialDef: imagesToNumber(
        page('.card-ability-def img')
          .map((i, img) => img.attribs.src)
          .get()
      ),
      initialSpd: imagesToNumber(
        page('.card-ability-spd img')
          .map((i, img) => img.attribs.src)
          .get()
      ),
      initialVir: imagesToNumber(
        page('.card-ability-vir img')
          .map((i, img) => img.attribs.src)
          .get()
      ),
      initialStg: imagesToNumber(
        page('.card-ability-stg img')
          .map((i, img) => img.attribs.src)
          .get()
      ),
      finalAtk: imagesToNumber(
        page('.rcard-ability-atk img')
          .map((i, img) => img.attribs.src)
          .get()
      ),
      finalDef: imagesToNumber(
        page('.rcard-ability-def img')
          .map((i, img) => img.attribs.src)
          .get()
      ),
      finalSpd: imagesToNumber(
        page('.rcard-ability-spd img')
          .map((i, img) => img.attribs.src)
          .get()
      ),
      finalVir: imagesToNumber(
        page('.rcard-ability-vir img')
          .map((i, img) => img.attribs.src)
          .get()
      ),
      finalStg: imagesToNumber(
        page('.rcard-ability-stg img')
          .map((i, img) => img.attribs.src)
          .get()
      ),
      personality: page('.card-personality').text(),
      slogan: page('.card-slogan').text(),
      history: page('.card-history').text(),
      trainSkills: page('.card-train-skill-name').text(),
      tradable: page('.card-trade').length === 0
    };
  };
}
