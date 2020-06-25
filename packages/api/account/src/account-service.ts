import { makeRequest, NOBOT_URL, Service } from '@nobot-core/commons';
import { Account, AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm/connection/Connection';

@Service()
export default class AccountService {
  private logger = getLogger(AccountService.name);

  private accountRepository: AccountRepository;

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
  }

  getAll = (): Promise<Account[]> => {
    return this.accountRepository.find({
      order: {
        login: 'ASC'
      }
    });
  };

  getLastMobileAccount = async (): Promise<string> => {
    const account = await this.accountRepository.getLastMobileAccount();
    return account.login;
  };

  create = (account: Partial<Account>): Promise<Account> => {
    return this.accountRepository.save(account);
  };

  refineQuest = async (login: string): Promise<void> => {
    this.logger.info('Start refine quest for %s', login);
    const refineCardPage = (await makeRequest(NOBOT_URL.REFINE_CARD, 'GET', login)) as CheerioStatic;
    const refineCardId = this.getRefineCardId(refineCardPage);
    if (refineCardId) {
      const materialCardIds = this.getMaterialCardIds(refineCardPage);
      // use reduce to make a sequential promise chain
      const initPromise = Promise.resolve();
      await materialCardIds.reduce(
        async (
          previous: Promise<string | CheerioStatic | void>,
          materialCardId: string
        ): Promise<string | CheerioStatic | void> => {
          await previous;
          this.logger.info('refine %s by %s for %s', refineCardId, materialCardId, login);
          const postData = `mode_id=6&point_type=1&refine_card_id=${refineCardId}&material_card_id=${materialCardId}&skill_index=0&slot_index=0&trainer=1&catevent=0&refine_item_type_id=0&refine_item_num=0`;
          return makeRequest(NOBOT_URL.REFINE_CARD_SUB, 'POST', login, postData);
        },
        initPromise
      );
      this.logger.info('Finish refine quest for %s', login);
    } else {
      this.logger.error('Unable to find 本多ただキャッツ for %s', login);
    }
  };

  private getRefineCardId = (page: CheerioStatic): string | null => {
    let refineCardId: string | null = null;
    const deckCards = page('.deck-group .deck-rect .card-face');
    if (deckCards.length > 0) {
      deckCards.each((index) => {
        const deckCard = deckCards.eq(index);
        if (deckCard.attr('title') === '本多ただキャッツ') {
          const idMatch = deckCard.attr('class')?.match(/(?<=face-card-id)[0-9]+(?= )/);
          if (idMatch) {
            [refineCardId] = idMatch;
          }
        }
      });
    }
    return refineCardId;
  };

  private getMaterialCardIds = (page: CheerioStatic): string[] => {
    const materialCardIds: string[] = [];
    const trainerCards = page('.trainer-group .trainer-card');
    if (trainerCards.length > 0) {
      let count = 0;
      trainerCards.each((index) => {
        if (count < 10) {
          const trainerCard = trainerCards.eq(index);
          const number = parseInt(trainerCard.find('span[class^=trainer-card-count]').text(), 10);
          const idMatch = trainerCard.attr('class')?.match(/(?<=trainer-card-id)[0-9]+(?= )/);
          if (idMatch) {
            const [id] = idMatch;
            // add n timers or until count reach 10
            for (let i = 0; i < number && count + i < 10; i++) {
              materialCardIds.push(id);
            }
          }
          count += number;
        }
      });
    }
    return materialCardIds;
  };
}
