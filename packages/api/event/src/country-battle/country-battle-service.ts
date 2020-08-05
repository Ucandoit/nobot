import {
  executeConcurrent,
  getFinalPage,
  makeMobileRequest,
  makePostMobileRequest,
  NobotTask,
  NOBOT_MOBILE_URL,
  regexUtils,
  Service
} from '@nobot-core/commons';
import { AccountConfigRepository, AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';

@Service()
export default class CountryBattleService {
  private logger = getLogger(CountryBattleService.name);

  private accountRepository: AccountRepository;

  private accountConfigRepository: AccountConfigRepository;

  private countryBattleTasks = new Map<string, NobotTask>();

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.accountConfigRepository = connection.getCustomRepository(AccountConfigRepository);
  }

  startAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccountsNeedCountryBattle();
    executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        await this.startCountryBattle(login);
      },
      10
    );
  };

  stopAll = async (): Promise<void> => {
    Array.from(this.countryBattleTasks.keys()).forEach((login) => {
      this.stop(login);
    });
  };

  start = async (login: string): Promise<void> => {
    const task = this.countryBattleTasks.get(login);
    if (task && task.start) {
      this.logger.info('Country battle task is already in progress for %s.', login);
    } else {
      this.countryBattleTasks.set(login, { start: true });
      this.logger.info('Start to country battle for %s', login);
      await this.startCountryBattle(login);
    }
  };

  stop = (login: string): void => {
    this.logger.info('Stop country battle for %s', login);
    const task = this.countryBattleTasks.get(login);
    if (task && task.interval) {
      clearInterval(task.interval);
    }
    this.countryBattleTasks.delete(login);
  };

  startCountryBattle = async (login: string): Promise<void> => {
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
      if (currentFood < 50) {
        this.logger.info('Not enough food for %s.', login);
        this.stop(login);
        return;
      }
      page = await makeMobileRequest(NOBOT_MOBILE_URL.PROFILE, login);
      const wins = regexUtils.catchByRegex(
        page('#main > div').eq(6).find('table tr').eq(1).find('td').eq(2).text(),
        /[0-9]+/,
        'integer'
      );
      if (wins && wins >= 50) {
        this.logger.info('Country battle finished for %s.', login);
        await this.accountConfigRepository.update(login, { wrestleClear: true });
        this.stop(login);
        return;
      }
      page = await makeMobileRequest(NOBOT_MOBILE_URL.GATE_CONFIRM, login);
      const form = page('form');
      this.logger.info('Start fight for %s.', login);
      await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
      this.logger.info('Wait 60 seconds for next fight for %s.', login);
      const interval = setTimeout(() => {
        this.startCountryBattle(login);
      }, 61 * 1000);
      const task = this.countryBattleTasks.get(login) as NobotTask;
      this.countryBattleTasks.set(login, {
        ...task,
        interval
      });
    } catch (err) {
      this.logger.error('Error while starting country battle for %s.', login);
      this.logger.error(err);
      this.stop(login);
    }
  };
}
