import {
  executeConcurrent,
  makeMobileRequest,
  makePostMobileRequest,
  NOBOT_MOBILE_URL,
  Service
} from '@nobot-core/commons';
import { AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';

@Service()
export default class ManageCardService {
  private logger = getLogger(ManageCardService.name);

  private accountRepository: AccountRepository;

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
  }

  moveSampleCard = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    await executeConcurrent(
      accounts.map((account) => account.login),
      this.moveCard,
      10,
      1250
    );
  };

  manageSampleDeck = async (): Promise<void> => {
    const login = 'zz0001';
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.MANAGE_DECK, login);
    const form = page('#form');
    const reserveCard = form.find('#form_reserve-card1').val();
    const reserveBase = form.find('#form_reserve-base1').val();
    const postData = form
      .serialize()
      .replace(/(?<=&deck-card1=)[0-9]+(?=&)/, reserveCard)
      .replace(/(?<=&deck-base1=)[0-9]+(?=&)/, reserveBase)
      .replace(/(?<=&leader-value=)[0-9]+(?=&)/, reserveCard);
    await makePostMobileRequest(form.attr('action') as string, login, postData, false);
  };

  private moveCard = async (login: string, cardId: number): Promise<void> => {
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.MANAGE_STORED_CARDS, login);
    const cardFace = page(`.face-card-id${cardId}`);
    if (cardFace.length > 0) {
      const moveUrl = cardFace.parents('table').parents('table').next().find('a').attr('href');
      if (moveUrl) {
        const confirmPage = await makeMobileRequest(moveUrl, login, false);
        const form = confirmPage('#sp_sc_5').parent();
        if (form.length > 0) {
          this.logger.info('Move card %d for %s', cardId, login);
          await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
          return;
        }
      }
      this.logger.error('Error while move card %d for %s.', cardId, login);
    } else {
      this.logger.error('Card %d not found for %s.', cardId, login);
    }
  };
}
