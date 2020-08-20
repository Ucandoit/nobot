import {
  executeConcurrent,
  getFinalPage,
  makeMobileRequest,
  makePostMobileRequest,
  NobotTask,
  nobotUtils,
  NOBOT_MOBILE_URL,
  regexUtils,
  Service
} from '@nobot-core/commons';
import { AccountRepository } from '@nobot-core/database';
import he from 'he';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';

@Service()
export default class TerritoryBattleService {
  private logger = getLogger(TerritoryBattleService.name);

  private accountRepository: AccountRepository;

  // private accountConfigRepository: AccountConfigRepository;

  private territoryBattleTasks = new Map<string, NobotTask>();

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    // this.accountConfigRepository = connection.getCustomRepository(AccountConfigRepository);
  }

  joinAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    await executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        if (login.startsWith('zzz')) {
          await this.joinCountry(login);
        }
      },
      10
    );
  };

  fixAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    await executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        if (login.startsWith('zzz')) {
          try {
            const seconds = await this.goToCountry(login, 134);
            setTimeout(async () => {
              try {
                await this.goToCountry(login, 135);
              } catch (err) {
                this.logger.error(login);
              }
            }, seconds * 1000);
          } catch (err) {
            this.logger.error(login);
          }
        }
      },
      10
    );
  };

  checkAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    await executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        if (login.startsWith('zzz')) {
          const page = await getFinalPage(`${NOBOT_MOBILE_URL.TERRITORY_INFO}?mpid=135`, login);
          this.logger.info('Status %s for %s.', page('#heal-command').length > 0 ? 'OK' : 'KO', login);
        }
      },
      10
    );
  };

  healAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    await executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        if (login.startsWith('zzz')) {
          await this.heal(login);
        }
      },
      10
    );
  };

  joinCountry = async (login: string): Promise<void> => {
    let page = await getFinalPage(`${NOBOT_MOBILE_URL.TERRITORY_MANAGE_DECK}?mpid=135`, login);
    const form = page('#form');
    const cardId1 = form.find('#form_reserve-card1').val();
    const cardBase1 = form.find('#form_reserve-base1').val();
    const cardId2 = form.find('#form_reserve-card2').val();
    const cardBase2 = form.find('#form_reserve-base2').val();
    const inputs = form.find('input');
    let postData = '';
    inputs.each((index, input) => {
      if (postData.length > 0) {
        postData += '&';
      }
      const name = page(input).attr('name');
      if (!name?.startsWith('reserve')) {
        postData += name;
        postData += '=';
        if (name === 'deck-card1') {
          postData += cardId1;
        } else if (name === 'deck-card2') {
          postData += cardId2;
        } else if (name === 'deck-base1') {
          postData += cardBase1;
        } else if (name === 'deck-base2') {
          postData += cardBase2;
        } else if (name === 'leader-value') {
          postData += cardId1;
        } else {
          postData += page(input).val();
        }
      }
    });
    page = await makePostMobileRequest(NOBOT_MOBILE_URL.TERRITORY_MANAGE_DECK, login, postData);
    const ok = page.html()?.includes(he.encode('国力回復'));
    this.logger.info('Status %s for %s.', ok ? 'OK' : 'KO', login);
  };

  heal = async (login: string): Promise<void> => {
    this.logger.info('Heal for %s.', login);
    // await getFinalPage(`${NOBOT_MOBILE_URL.TERRITORY_INFO}?mpid=135`, login);
    await makePostMobileRequest(
      `${NOBOT_MOBILE_URL.TERRITORY_INFO}?mpid=135`,
      login,
      '_t=1262271600000&healselect=6&value=0'
    );
  };

  start = async (login: string): Promise<void> => {
    const task = this.territoryBattleTasks.get(login);
    if (task && task.start) {
      this.logger.info('Territory battle task is already in progress for %s.', login);
    } else {
      this.territoryBattleTasks.set(login, { start: true });
      this.logger.info('Start to territory battle for %s', login);
      await this.startTerritoryBattle(login);
    }
  };

  stop = (login: string): void => {
    this.logger.info('Stop territory battle for %s', login);
    const task = this.territoryBattleTasks.get(login);
    if (task && task.interval) {
      clearInterval(task.interval);
    }
    this.territoryBattleTasks.delete(login);
  };

  startTerritoryBattle = async (login: string): Promise<void> => {
    try {
      this.logger.info('Checking availability for %s.', login);
      let page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
      let action = false;
      const deckCards = page('#pool_1 div[class^=face-card-id]');
      if (deckCards.length > 0) {
        deckCards.each((i, card) => {
          if (card.attribs.class.includes('action')) {
            action = true;
          }
        });
      }
      if (action) {
        this.logger.info('Deck cards in action for %s.', login);
        this.stop(login);
        return;
      }
      const currentFood = parseInt(page('#element_food').text(), 10);
      if (currentFood < 206) {
        this.logger.info('Not enough food for %s.', login);
        this.stop(login);
        return;
      }
      page = await makeMobileRequest(
        'http://210.140.157.168/mobile/unity/mobile_unity_setup.htm?mpid=147&bLevel=1&castleId=14',
        login
      );
      await makePostMobileRequest(
        'http://210.140.157.168/mobile/unity/mobile_unity_setup.htm',
        login,
        'castleId=14&bLevel=1&mpid=147&daimyoId=5&bField=14&weather=0'
      );
      this.logger.info('Wait 60 seconds for next fight for %s.', login);
      const interval = setTimeout(() => {
        this.startTerritoryBattle(login);
      }, 61 * 1000);
      const task = this.territoryBattleTasks.get(login) as NobotTask;
      this.territoryBattleTasks.set(login, {
        ...task,
        interval
      });
    } catch (err) {
      this.logger.error('Error while starting territory battle for %s.', login);
      this.logger.error(err);
      this.stop(login);
    }
  };

  goToCountry = async (login: string, countryId: number): Promise<number> => {
    this.logger.info('Go to %d for %s.', countryId, login);
    await getFinalPage(NOBOT_MOBILE_URL.AREA_MAP, login);
    const movePage = await makePostMobileRequest(NOBOT_MOBILE_URL.MAP_MOVE, login, `id=${countryId}`);
    const seconds = nobotUtils.getSeconds(
      regexUtils.catchByRegex(movePage.html(), /[0-9]{2}:[0-9]{2}:[0-9]{2}/) as string
    );
    const form = movePage('#sp_sc_5').parent();
    await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
    return seconds;
  };
}
