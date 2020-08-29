import {
  executeConcurrent,
  makeMobileRequest,
  makePostMobileRequest,
  makeRequest,
  NOBOT_MOBILE_URL,
  NOBOT_URL,
  regexUtils,
  Service
} from '@nobot-core/commons';
import {
  Account,
  AccountCard,
  AccountRepository,
  Card,
  CardRepository,
  SellStateRepository,
  StoreCard
} from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection, getCustomRepository, In, MoreThan, Not, Repository } from 'typeorm';
import { getProperty, getRarity, getStar, imagesToNumber } from './card-utils';

@Service()
export default class CardService {
  private logger = getLogger(CardService.name);

  private cardRepository: CardRepository;

  private accountRepository: AccountRepository;

  private accountCardRepository: Repository<AccountCard>;

  private storeCardRepository: Repository<StoreCard>;

  constructor(connection: Connection) {
    this.cardRepository = connection.getCustomRepository(CardRepository);
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.accountCardRepository = connection.getRepository<AccountCard>('AccountCard');
    this.storeCardRepository = connection.getRepository<StoreCard>('StoreCard');
  }

  getAll = async (
    page = 0,
    size = 20,
    sort: keyof Card = 'number',
    order: 'ASC' | 'DESC' = 'ASC',
    filters?: Record<keyof Card, string>
  ): Promise<[Card[], number]> => {
    return this.cardRepository.findAll(page, size, sort, order, filters);
  };

  scanAllStoredCards = async (): Promise<void> => {
    const accounts = await this.accountRepository.find({
      where: {
        expirationDate: MoreThan(new Date()),
        mobile: false
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

  scanAllAccountCards = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    executeConcurrent(
      accounts.map((account) => account.login),
      this.scanAccountCards,
      1
    );
  };

  private scanStoredPage = async (login: string, url: string, pages: number): Promise<number> => {
    const page = (await makeRequest(`${url}&pages=${pages}`, 'GET', login)) as CheerioStatic;
    const cardElements = page('.card');
    if (cardElements.length > 0) {
      cardElements.each(async (index) => {
        const cardElement = cardElements.eq(index);
        const id = regexUtils.catchByRegex(cardElement.attr('class'), /(?<=card card-id)[0-9]+$/, 'integer') as
          | number
          | null;
        if (id) {
          const count = parseInt(cardElement.parent().prev().find('span').last().text(), 10);
          const storeCard = await this.storeCardRepository.findOne({ login, id });
          if (storeCard) {
            storeCard.count = count;
            await this.storeCardRepository.save(storeCard);
          } else {
            await this.storeCardRepository.save({ login, id, count });
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

  htmlToAccountCard = (cardElement: Cheerio): Partial<AccountCard> => {
    let refineTotalText = '';
    if (cardElement.find('.card-refine-total').length > 0) {
      refineTotalText = cardElement.find('.card-refine-total b').text();
    } else {
      refineTotalText = cardElement.find('.card-refine-total-left b').text();
    }
    const [current, max] = refineTotalText.split('/');
    return {
      deed: parseInt(cardElement.find('.card-deed b').text(), 10),
      refineCurrent: parseInt(current.replace('Lv', ''), 10),
      refineMax: parseInt(max, 10),
      refineLvlAtk: parseInt(cardElement.find('.card-refine-atk').text().replace('Lv', ''), 10),
      refineLvlDef: parseInt(cardElement.find('.card-refine-def').text().replace('Lv', ''), 10),
      refineLvlSpd: parseInt(cardElement.find('.card-refine-spd').text().replace('Lv', ''), 10),
      refineLvlVir: parseInt(cardElement.find('.card-refine-vir').text().replace('Lv', ''), 10),
      refineLvlStg: parseInt(cardElement.find('.card-refine-stg').text().replace('Lv', ''), 10),
      refineAtk: imagesToNumber(
        (cardElement
          .find('.card-ability-atk img')
          .map((i, img) => img.attribs.src)
          .toArray() as unknown) as string[]
      ),
      refineDef: imagesToNumber(
        (cardElement
          .find('.card-ability-def img')
          .map((i, img) => img.attribs.src)
          .toArray() as unknown) as string[]
      ),
      refineSpd: imagesToNumber(
        (cardElement
          .find('.card-ability-spd img')
          .map((i, img) => img.attribs.src)
          .toArray() as unknown) as string[]
      ),
      refineVir: imagesToNumber(
        (cardElement
          .find('.card-ability-vir img')
          .map((i, img) => img.attribs.src)
          .toArray() as unknown) as string[]
      ),
      refineStg: imagesToNumber(
        (cardElement
          .find('.card-ability-stg img')
          .map((i, img) => img.attribs.src)
          .toArray() as unknown) as string[]
      ),
      tradable: cardElement.find('.card-trade').length === 0,
      limitBreak:
        regexUtils.catchByRegexAsNumber(
          cardElement.find('.card-limit-break-level').text() as string,
          /(?<=Lv)[0-9]+$/
        ) || 0
    };
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
        tradeId = regexUtils.catchByRegex(sellCard.attr('class'), /(?<=trade-sell-id)[0-9]+(?= )/) as string | null;
      }
    }
    if (tradeId) {
      await this.buyCard(source, tradeId);
      this.logger.info('card bought.');
    }
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

  scanAccountCards = async (login: string): Promise<void> => {
    try {
      this.logger.info(`Scan %s's deck cards.`, login);
      const cardIds: number[] = [];
      await this.scanAccountPage(login, NOBOT_MOBILE_URL.MANAGE_DECK_CARDS, 1, cardIds);
      const page = await makeMobileRequest(NOBOT_MOBILE_URL.MANAGE_RESERVE_CARDS, login);
      const inputButtons = page('input[type=button]');
      let pages = 1;
      inputButtons.each((i) => {
        const value = parseInt(inputButtons.eq(i).val(), 10);
        if (!Number.isNaN(value) && value > pages) {
          pages = value;
        }
      });
      for (let i = 1; i <= pages; i++) {
        this.logger.info(`Scan page %d of %s's reserve cards.`, i, login);
        // eslint-disable-next-line no-await-in-loop
        await this.scanAccountPage(login, NOBOT_MOBILE_URL.MANAGE_RESERVE_CARDS, i, cardIds);
      }
      // card does not exist anymore, need to update in sell state if it was selling before
      const cardsToDelete = await this.accountCardRepository.find({
        where: { account: { login }, id: Not(In(cardIds)) }
      });
      cardsToDelete.forEach(async (cardToDelete) => {
        const sellStateRepository = getCustomRepository(SellStateRepository);
        const sellState = await sellStateRepository.findOne(
          { accountCard: { id: cardToDelete.id } },
          { relations: ['accountCard', 'accountCard.card'] }
        );
        if (sellState) {
          this.logger.info('Archive sell state for %d', sellState.accountCard?.id);
          await sellStateRepository.update(sellState.id, {
            status: 'SOLD',
            sellDate: new Date(),
            archivedData: sellState.accountCard,
            accountCard: null
          });
        }
        this.logger.info('Delete account card %d of %s', cardToDelete.id, login);
        await this.accountCardRepository.delete(cardToDelete.id);
      });
    } catch (err) {
      this.logger.error(err);
    }
  };

  private scanAccountPage = async (login: string, url: string, pages: number, cardIds: number[]): Promise<void> => {
    const page = await makeMobileRequest(encodeURIComponent(`${url}&list_page=${pages}`), login);
    const cardFaces = page('img[class*=face-card-id]');
    if (cardFaces.length > 0) {
      const promises: Promise<void>[] = [];
      cardFaces.each(async (index) => {
        const cardFace = cardFaces.eq(index);
        promises.push(this.scanAccountCard(cardFace, login, url, cardIds));
      });
      await Promise.all(promises);
    } else {
      this.logger.info('Unable to find card faces for %s.', login);
    }
  };

  /**
   * Scan account card (mobile version).
   * @param cardFace dom element of card face
   * @param login account login
   * @param url deck card or reserved card url
   * @param cardIds scanned card ids (used to check if any card in database is deleted)
   */
  private scanAccountCard = async (cardFace: Cheerio, login: string, url: string, cardIds: number[]): Promise<void> => {
    const cardId = regexUtils.catchByRegexAsNumber(cardFace.attr('class'), /(?<=face-card-id)[0-9]+/);
    if (cardId) {
      const cardBlock = cardFace.parents('table').last().parent();
      const cardPage = await makePostMobileRequest(NOBOT_MOBILE_URL.CARD_DETAIL, login, `cardid=${cardId}`);
      const newCard = {
        ...this.htmlToAccountCard(cardPage('.card')),
        deckCard: url === NOBOT_MOBILE_URL.MANAGE_DECK_CARDS,
        protect: cardBlock.find('img[src*="key_mark"]').length > 0,
        helper: cardBlock.find('img[src*="key_helper"]').length > 0,
        account: { login }
      };
      const accountCard = await this.accountCardRepository.findOne(cardId, {
        select: ['id', 'card'],
        relations: ['card']
      });
      if (accountCard) {
        // update
        this.logger.info('Update account card %s for %s.', accountCard.card.name, login);
        this.accountCardRepository.update(cardId, newCard);
      } else {
        // create
        const number = parseInt(cardBlock.find('font').first().text().replace('No.', ''), 10);
        const card = await this.cardRepository.findOne({ number, tradable: newCard.tradable });
        if (card) {
          this.logger.info('Create account card %s for %s.', card.name, login);
          await this.accountCardRepository.save({
            ...newCard,
            id: cardId,
            card: { id: card.id }
          });
        } else {
          this.logger.error('Card %d not found.', number);
        }
      }
      cardIds.push(cardId);
    } else {
      this.logger.error('Unable to get card id for %s', login);
    }
  };
}
