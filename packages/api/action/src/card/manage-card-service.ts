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

interface CardIdentifier {
  id: number;
  number: number;
}

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
    const accounts = await this.accountRepository.getMobileAccounts();
    await executeConcurrent(
      accounts.map((account) => account.login),
      this.manageDeck,
      10
    );
  };

  manageDeck = async (login: string): Promise<void> => {
    const atkCard = {
      number: 2088,
      inDeck: false,
      id: -1
    };
    const healCard = {
      number: 2103,
      inDeck: false,
      id: -1
    };

    // check if cards are in deck
    let page = await makeMobileRequest(NOBOT_MOBILE_URL.MANAGE_DECK_CARDS, login);
    const deckCardIdentifiers = this.getCardIdentifiers(page);
    deckCardIdentifiers.forEach((identifier) => {
      if (identifier.number === atkCard.number) {
        atkCard.inDeck = true;
      } else if (identifier.number === healCard.number) {
        healCard.inDeck = true;
      }
    });

    if (atkCard.inDeck && healCard.inDeck) {
      this.logger.info('Both cards are in deck for %s.', login);
      return;
    }

    // get id of cards to change
    page = await makeMobileRequest(NOBOT_MOBILE_URL.MANAGE_RESERVE_CARDS, login);
    const reserveCardIdentifiers = this.getCardIdentifiers(page);
    reserveCardIdentifiers.forEach((identifier) => {
      if (!atkCard.inDeck && identifier.number === atkCard.number) {
        atkCard.id = identifier.id;
      } else if (!healCard.inDeck && identifier.number === healCard.number) {
        healCard.id = identifier.id;
      }
    });

    if (!atkCard.inDeck && atkCard.number === -1) {
      this.logger.error('Atk card not found in reserve cards for %s', login);
      return;
    }
    if (!healCard.inDeck && healCard.number === -1) {
      this.logger.error('Heal card not found in reserve cards for %s', login);
      return;
    }

    // change deck
    page = await makeMobileRequest(NOBOT_MOBILE_URL.MANAGE_DECK, login);
    const form = page('#form');
    let postData = form.serialize().replace(/(?<=&formation-value=)[0-9]+(?=&)/, '6');
    if (!atkCard.inDeck) {
      postData = postData.replace(/(?<=&deck-card4=)[0-9]+(?=&)/, atkCard.id.toString());
    }
    if (!healCard.inDeck) {
      postData = postData
        .replace(/(?<=&deck-card1=)[0-9]+(?=&)/, healCard.id.toString())
        .replace(/(?<=&leader-value=)[0-9]+(?=&)/, healCard.id.toString());
    }
    await makePostMobileRequest(form.attr('action') as string, login, postData, false);
    this.logger.info('Deck changed for %s', login);
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

  private getCardIdentifiers = (page: CheerioStatic): CardIdentifier[] => {
    const cardIdentifiers: CardIdentifier[] = [];
    const checkboxes = page('input[name=ids]');
    for (let i = 0; i < checkboxes.length; i++) {
      const checkbox = checkboxes.eq(i);
      const id = parseInt(checkbox.val(), 10);
      const numberText = checkbox.parent().next().children().first().text();
      const number = parseInt(numberText.replace('No.', ''), 10);
      cardIdentifiers.push({ id, number });
    }
    return cardIdentifiers;
  };
}
