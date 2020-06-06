import { makeRequest, NOBOT_URL, regexUtils } from '@nobot-core/commons';
import { Account, AccountCard, Card, CardRepository, StoreCard } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { getConnection, getCustomRepository, MoreThan } from 'typeorm';
import { getProperty, getRarity, getStar } from './card-utils';

class CardService {
  private logger = getLogger(CardService.name);

  getAll = async (
    page = 0,
    size = 20,
    sort: keyof Card = 'number',
    order: 'ASC' | 'DESC' = 'ASC',
    filters: Record<keyof Card, string>
  ): Promise<[Card[], number]> => {
    return getCustomRepository(CardRepository).findAll(page, size, sort, order, filters);
  };

  scanAllStoredCards = async (): Promise<void> => {
    const accounts = await getConnection()
      .getRepository<Account>('Account')
      .find({
        where: {
          expirationDate: MoreThan(new Date())
        },
        order: {
          login: 'ASC'
        }
      });
    await accounts.reduce(async (previous: Promise<void>, account: Account): Promise<void> => {
      await previous;
      return this.scanStoredCards(account.login);
    }, Promise.resolve());
  };

  scanStoredCards = async (login: string): Promise<void> => {
    try {
      let nextPage = 1;
      while (nextPage > 0) {
        this.logger.info(`Scan page %d of %s's stored cards.`, nextPage, login);
        // eslint-disable-next-line no-await-in-loop
        nextPage = await this.scanStoredPage(login, NOBOT_URL.MANAGE_STORED_CARDS, nextPage);
      }
    } catch (err) {
      this.logger.error(err);
    }
  };

  scanAccountCards = async (login: string): Promise<void> => {
    try {
      let nextPage = 1;
      const cardIds: string[] = [];
      while (nextPage > 0) {
        this.logger.info(`Scan page %d of %s's reserve cards.`, nextPage, login);
        // eslint-disable-next-line no-await-in-loop
        nextPage = await this.scanAccountPage(login, NOBOT_URL.MANAGE_RESERVE_CARDS, nextPage, cardIds);
      }
      this.logger.info(`Scan %s's deck cards.`, login);
      await this.scanAccountPage(login, NOBOT_URL.MANAGE_DECK_CARDS, 1, cardIds);
      // delete
    } catch (err) {
      this.logger.error(err);
    }
  };

  private scanStoredPage = async (login: string, url: string, pages: number): Promise<number> => {
    const page = (await makeRequest(`${url}&pages=${pages}`, 'GET', login)) as CheerioStatic;
    const cardElements = page('.card');
    if (cardElements.length > 0) {
      cardElements.each(async (index) => {
        const cardElement = cardElements.eq(index);
        const id = regexUtils.catchByRegex(cardElement.attr('class'), /(?<=card card-id)[0-9]+$/);
        if (id) {
          const cardId = parseInt(id, 10);
          const count = parseInt(cardElement.parent().prev().find('span').last().text(), 10);
          const repository = getConnection().getRepository<StoreCard>('StoreCard');
          const storeCard = await repository.findOne({ login, id: cardId });
          if (storeCard) {
            storeCard.count = count;
            await repository.save(storeCard);
          } else {
            await repository.save({ login, id: cardId, count });
          }
        }
      });
    }
    // check if there is a next page
    let nextPage = -1;
    const currentPages = page('.current-page');
    currentPages.each((index) => {
      const nextElement = currentPages.eq(index).next();
      if (nextElement && nextElement.hasClass('other-page')) {
        nextPage = pages + 1;
      }
    });
    return nextPage;
  };

  private scanAccountPage = async (login: string, url: string, pages: number, cardIds: string[]): Promise<number> => {
    const page = (await makeRequest(`${url}&pages=${pages}`, 'GET', login)) as CheerioStatic;
    const cardElements = page('.card');
    if (cardElements.length > 0) {
      cardElements.each(async (index) => {
        const cardElement = cardElements.eq(index);
        const id = regexUtils.catchByRegex(cardElement.attr('class'), /(?<=card card-id)[0-9]+/);
        if (id) {
          cardIds.push(id);
          const cardId = parseInt(id, 10);
          const repository = getConnection().getRepository<AccountCard>('AccountCard');
          const accountCard = await repository.findOne({ id: cardId });
          if (accountCard) {
            // update
          } else {
            // create
          }
        }
      });
    }
    // check if there is a next page
    let nextPage = -1;
    const currentPages = page('.current-page');
    currentPages.each((index) => {
      const nextElement = currentPages.eq(index).next();
      if (nextElement && nextElement.hasClass('other-page')) {
        nextPage = pages + 1;
      }
    });
    return nextPage;
  };

  getCardDetail = async (cardId: string, login: string): Promise<any> => {
    const page = (await makeRequest(NOBOT_URL.CARD_DETAIL, 'POST', login, `cardid=${cardId}`)) as CheerioStatic;
    return {
      id: cardId,
      name: page('.card-name').text(),
      realName: page('.card-real-name').text(),
      property: getProperty(page('.card-property').attr('src')),
      rarity: getRarity(page('.card-rarity').attr('src')),
      star: getStar(page('.card-rarity').attr('src')),
      deed: page('.card-deed').text(),
      refineTotal:
        page('.card-refine-total').length > 0
          ? page('.card-refine-total').text()
          : page('.card-refine-total-left').text(),
      refineAtk: page('.card-refine-atk').text(),
      refineDef: page('.card-refine-def').text(),
      refineSpd: page('.card-refine-spd').text(),
      refineVir: page('.card-refine-vir').text(),
      refineStg: page('.card-refine-stg').text(),
      skill1: `${page('.card-skill1').text()}${page('.card-skill-lv1').text()}`,
      skill2: `${page('.card-skill2').text()}${page('.card-skill-lv2').text()}`,
      skill3: `${page('.card-skill3').text()}${page('.card-skill-lv3').text()}`
    };
  };

  scanAllRewardCards = async (): Promise<void> => {
    const cards = await getCustomRepository(CardRepository).find();
    await cards.reduce(async (previous: Promise<void>, card: Card): Promise<void> => {
      await previous;
      return this.scanRewardCard(card);
    }, Promise.resolve());
  };

  scanRewardCard = async (card: Card): Promise<void> => {
    this.logger.info('Scan card %d', card.id);
    const page = (await makeRequest(
      NOBOT_URL.REWARD_CARD_DETAIL,
      'POST',
      'ucandoit',
      `cardid=${card.id}`
    )) as CheerioStatic;
    const tradable = page('.card-trade').length === 0;
    if (!tradable) {
      // eslint-disable-next-line no-param-reassign
      card.tradable = tradable;
      await getCustomRepository(CardRepository).save(card);
    }
  };

  tradeNp = async (source: string, target: string): Promise<void> => {
    this.logger.info('trade np from %s to %s.', source, target);
    const np = await this.getNp(source);
    let page = (await makeRequest(
      `${NOBOT_URL.MANAGE_STORED_CARDS}&pages=1&limit_rank=1&sell_card=1`,
      'GET',
      target
    )) as CheerioStatic;
    const card = page('.card');
    const cardId = regexUtils.catchByRegex(card.attr('class'), /(?<=card card-id)[0-9]+$/g);
    const fileId = regexUtils.catchByRegex(card.parent().find('.sell-button').attr('class'), /(?<=file-id)[0-9]+(?= )/);
    const postData = `mode=1&card-id=${cardId}&trade-id=&limit_rank=1&storage-card=${cardId}&fileid=${fileId}&form_name=form&point=${np}&term=1&handle=1`;
    await makeRequest(NOBOT_URL.TRADE_SELL, 'POST', target, postData);
    this.logger.info('card posted for %d.', np);
    page = (await makeRequest(NOBOT_URL.TRADE_SELL, 'GET', target)) as CheerioStatic;
    const sellList = page('div[id^=sell-list]');
    let tradeId = null;
    for (let i = 0; i < sellList.length; i++) {
      const sellCard = sellList.eq(i);
      if (sellCard.children().eq(2).children().eq(0).text() === np.toString()) {
        tradeId = regexUtils.catchByRegex(sellCard.attr('class'), /(?<=trade-sell-id)[0-9]+(?= )/);
      }
    }
    if (tradeId) {
      await this.buyCard(source, tradeId);
      this.logger.info('card bought.');
    }
  };

  sell = async (login: string, cardId: string, sellPrice: number): Promise<void> => {
    const postData = `mode=1&card-id=${cardId}&trade-id=&form_name=form&point=${sellPrice}&term=3&handle=1`;
    await makeRequest(NOBOT_URL.TRADE_SELL, 'POST', login, postData);
    this.logger.info('card %s posted for %d by %s.', cardId, sellPrice, login);
  };

  private getNp = async (login: string): Promise<number> => {
    const page = (await makeRequest(NOBOT_URL.VILLAGE, 'GET', login)) as CheerioStatic;
    return parseInt(page('#lottery_point').text(), 10);
  };

  private buyCard = async (login: string, tradeId: string): Promise<void> => {
    const searchUrl = (await makeRequest(NOBOT_URL.TRADE_BUY, 'GET', login)) as string;
    const page = (await makeRequest(searchUrl, 'GET', login)) as CheerioStatic;
    const buyForm = page('#form');
    const requestParams = buyForm.serialize().replace(/(?<=&trade-id=)[0-9]+(?=&)/, tradeId);
    await makeRequest(NOBOT_URL.TRADE_BUY, 'POST', login, requestParams);
  };
}

export default new CardService();
