import {
  executeConcurrent,
  getFinalPage,
  makeMobileRequest,
  makePostMobileRequest,
  NOBOT_MOBILE_URL,
  regexUtils,
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

  findAccountCardByNumber = async (number: number, login: string): Promise<{ id: number; inDeck: boolean }> => {
    let card = await this.findCardByNumber(number, login, true);
    if (card.id === -1) {
      card = await this.findCardByNumber(number, login, false);
    }
    return card;
  };

  learnSkill = async (login: string, cardId: number): Promise<void> => {
    const page = await makePostMobileRequest(NOBOT_MOBILE_URL.CARD_DETAIL, login, `cardid=${cardId}&button=1`);
    await this.learnSkillLoop(login, cardId, page);
  };

  learnSkillSample = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccountsByStatus('FINISH');
    await executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        const atkCard = await this.findAccountCardByNumber(2088, login);
        if (atkCard.id > 0) {
          await this.learnSkill(login, atkCard.id);
        }
        const healCard = await this.findAccountCardByNumber(2103, login);
        if (healCard.id > 0) {
          await this.learnSkill(login, healCard.id);
        }
      },
      10
    );
  };

  refineQuest = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccountsNeedRefine();
    await executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        this.logger.info('Start refine quest for %s', login);
        const healCard = await this.findAccountCardByNumber(2103, login);
        if (healCard.id > 0) {
          const page = await makeMobileRequest(NOBOT_MOBILE_URL.REFINE_CARD, login);
          const materialCardIds = this.getMaterialCardIds(page);
          await executeConcurrent(
            materialCardIds,
            async (materialId: number) => {
              this.logger.info('Refine %d by %d for %s', healCard.id, materialId, login);
              const postData = `cat=3&mc=1&kind=2&tgt=0&from=0&catev=0&refitemid=0&refitemnum=0&card_id_1=${healCard.id}&trainer_id=${materialId}`;
              await makePostMobileRequest(NOBOT_MOBILE_URL.UPGRADE, login, postData);
              await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
            },
            1
          );
          this.logger.info('Finish refine quest for %s', login);
        } else {
          this.logger.error('Unable to find refine card for %s', login);
        }
      },
      10
    );
  };

  private getMaterialCardIds = (page: CheerioStatic): number[] => {
    const materialCardIds: number[] = [];
    const trainerCards = page('#pool_4_list div[class^=trainer-card-id]');
    if (trainerCards.length >= 10) {
      let count = 0;
      trainerCards.each((index) => {
        if (count < 10) {
          const trainerCard = trainerCards.eq(index);
          const number = parseInt(trainerCard.find('span[class^=trainer-card-count]').text(), 10);
          const id = regexUtils.catchByRegex(
            trainerCard.attr('class'),
            /(?<=trainer-card-id)[0-9]+/,
            'integer'
          ) as number;
          // add n timers or until count reach 10
          for (let i = 0; i < number && count + i < 10; i++) {
            materialCardIds.push(id);
          }
          count += number;
        }
      });
    }
    return materialCardIds;
  };

  private findCardByNumber = async (
    number: number,
    login: string,
    inDeck: boolean
  ): Promise<{ id: number; inDeck: boolean }> => {
    const card = {
      id: -1,
      inDeck
    };
    const page = await makeMobileRequest(
      inDeck ? NOBOT_MOBILE_URL.MANAGE_DECK_CARDS : NOBOT_MOBILE_URL.MANAGE_RESERVE_CARDS,
      login
    );
    const checkboxes = page('input[name=ids]');
    for (let i = 0; i < checkboxes.length; i++) {
      const checkbox = checkboxes.eq(i);
      const numberText = checkbox.parent().next().children().first().text();
      if (number === parseInt(numberText.replace('No.', ''), 10)) {
        card.id = parseInt(checkbox.val(), 10);
        card.inDeck = true;
        break;
      }
    }
    return card;
  };

  moveCard = async (login: string, cardId: number): Promise<void> => {
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

  private learnSkillLoop = async (login: string, cardId: number, page: CheerioStatic): Promise<void> => {
    const learnSkillButton = page('.card-learn-skill');
    if (learnSkillButton.length > 0) {
      const confirmUrl = learnSkillButton.parent().parent().attr('href') as string;
      const confirmPage = await makeMobileRequest(confirmUrl, login, false);
      if (confirmPage('form').length > 0) {
        const addForm = confirmPage('form').first();
        const procPage = await makePostMobileRequest(
          addForm.attr('action') as string,
          login,
          addForm.serialize(),
          false
        );
        if (procPage('form').length > 0) {
          const procForm = procPage('form').first();
          this.logger.info(
            'Learn skill %s for card %d of %s',
            procForm.find('input[name=skill_id]').val(),
            cardId,
            login
          );
          const resultPage = await makePostMobileRequest(
            procForm.attr('action') as string,
            login,
            procForm.serialize(),
            false
          );
          const redirectUrl = regexUtils.catchByRegex(resultPage.html(), /(?<=nextURL = ").+(?=")/) as string;
          if (redirectUrl) {
            const nextPage = await makeMobileRequest(redirectUrl, login, false);
            await this.learnSkillLoop(login, cardId, nextPage);
          }
          return;
        }
      }
      this.logger.error('Error while learning skill for card %d of %s', cardId, login);
    } else {
      this.logger.info('No skill to learn for card %d of %s', cardId, login);
    }
  };
}
