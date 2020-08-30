import {
  executeConcurrent,
  makeMobileRequest,
  makePostMobileRequest,
  NOBOT_MOBILE_URL,
  regexUtils,
  Service
} from '@nobot-core/commons';
import {
  AccountCard,
  AccountCardRepository,
  AccountRepository,
  CardRepository,
  SellStateRepository
} from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection, In, Not } from 'typeorm';
import { imagesToNumber } from '../card-utils';

@Service()
export default class AccountCardService {
  private logger = getLogger(AccountCardService.name);

  private cardRepository: CardRepository;

  private accountRepository: AccountRepository;

  private accountCardRepository: AccountCardRepository;

  private sellStateRepository: SellStateRepository;

  constructor(connection: Connection) {
    this.cardRepository = connection.getCustomRepository(CardRepository);
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.accountCardRepository = connection.getCustomRepository(AccountCardRepository);
    this.sellStateRepository = connection.getCustomRepository(SellStateRepository);
  }

  getAccountCards = (login: string): Promise<AccountCard[]> => {
    return this.accountCardRepository.findByLogin(login);
  };

  scanAllAccountCards = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    executeConcurrent(
      accounts.map((account) => account.login),
      this.scanAccountCards,
      1
    );
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
        const sellState = await this.sellStateRepository.findOne(
          { accountCard: { id: cardToDelete.id } },
          { relations: ['accountCard', 'accountCard.card'] }
        );
        if (sellState) {
          this.logger.info('Archive sell state for %d', sellState.accountCard?.id);
          await this.sellStateRepository.update(sellState.id, {
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
        await this.accountCardRepository.update(cardId, newCard);
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

  private htmlToAccountCard = (cardElement: Cheerio): Partial<AccountCard> => {
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
}
