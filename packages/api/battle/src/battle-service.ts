import {
  executeConcurrent,
  getFinalPage,
  makeMobileRequest,
  makePostMobileRequest,
  nobotUtils,
  NOBOT_MOBILE_URL,
  regexUtils,
  Service
} from '@nobot-core/commons';
import { AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';
import countryConfig from './country-config';
import { Country } from './types';

interface BattleTask {
  start: boolean;
  interval?: NodeJS.Timeout;
}

@Service()
export default class BattleService {
  private logger = getLogger(BattleService.name);

  private battleTasks = new Map<string, BattleTask>();

  private accountRepository: AccountRepository;

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
  }

  startAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccountsNeedBattle();
    executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        await this.start(login);
      },
      10
    );
  };

  stopAll = async (): Promise<void> => {
    Array.from(this.battleTasks.keys()).forEach((login) => {
      this.stop(login);
    });
  };

  start = async (login: string): Promise<void> => {
    const task = this.battleTasks.get(login);
    if (task && task.start) {
      this.logger.info('Battle task is already in progress for %s.', login);
    } else {
      this.battleTasks.set(login, { start: true });
      this.logger.info('Start to battle for %s', login);
      await this.startBattle(login);
    }
  };

  stop = (login: string): void => {
    this.logger.info('Stop battle for %s', login);
    const task = this.battleTasks.get(login);
    if (task && task.interval) {
      clearInterval(task.interval);
    }
    this.battleTasks.delete(login);
  };

  startBattle = async (login: string): Promise<void> => {
    this.logger.info('Checking availability for %s.', login);
    let page = await getFinalPage(NOBOT_MOBILE_URL.AREA_MAP, login);
    const currentFood = parseInt(page('#element_food').text(), 10);
    page = await makeMobileRequest(NOBOT_MOBILE_URL.MANAGE_DECK, login);
    const deckFood = parseInt(page('.food').text(), 10);
    if (currentFood < deckFood) {
      this.logger.info('Not enough food for %s.', login);
      return;
    }
    const friendships = await this.getFriendships(login);
    const targetCountry = this.getLowestFriendshipCountry(friendships, '');
    await this.goToCountry(login, targetCountry);
  };

  getFriendships = async (login: string): Promise<Map<string, number>> => {
    const friendships = new Map<string, number>();
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.PROFILE, login);
    const friendshipTable = page('#main').children().eq(16);
    const rows = friendshipTable.find('tr');
    for (let i = 1; i < rows.length; i++) {
      const row = rows.eq(i);
      const country = row.find('td').first().text();
      const level = regexUtils.catchByRegex(
        row.find('td').eq(1).find('img').attr('src'),
        /(?<=friendship_daimyo_)[0-9]/,
        'integer'
      ) as number;
      friendships.set(country, level);
    }
    return friendships;
  };

  getLowestFriendshipCountry = (friendships: Map<string, number>, exceptCountry: string): Country => {
    let levelRef = -1;
    let countryRef = '';
    friendships.forEach((level: number, country: string) => {
      if ((levelRef > level || levelRef === -1) && country !== exceptCountry) {
        levelRef = level;
        countryRef = country;
      }
    });
    return countryConfig.getCountryList().find((c) => c.name === countryRef) as Country;
  };

  goToCountry = async (login: string, targetCountry: Country): Promise<void> => {
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.AREA_MAP, login);
    const areas = page('#mapbg area');
    const countryIds: number[] = areas.map((i, area) => parseInt(area.attribs.id, 10)).get();
    const currentCountry = countryConfig.getCountryList().find((c) => !countryIds.includes(c.id));
    if (currentCountry === targetCountry) {
      this.logger.info('Already at %s for %s', targetCountry.city, login);
      this.fightEnemy(login);
    } else {
      const movePage = await makePostMobileRequest(NOBOT_MOBILE_URL.MAP_MOVE, login, `id=${targetCountry.id}`);
      const seconds = nobotUtils.getSeconds(
        regexUtils.catchByRegex(movePage.html(), /[0-9]{2}:[0-9]{2}:[0-9]{2}/) as string
      );
      const form = movePage('#sp_sc_5').parent();
      await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
      this.logger.info('Wait %d seconds to go to %s for %s', seconds, targetCountry.city, login);
      setTimeout(() => {
        this.fightEnemy(login);
      }, seconds * 1000);
    }
  };

  fightEnemy = async (login: string): Promise<void> => {
    try {
      let page = await makeMobileRequest(NOBOT_MOBILE_URL.AREA_MAP, login);
      const emenyContainers = page('.enemy_container');
      if (emenyContainers.length === 0) {
        this.logger.info('No enemy left, go to next country.');
        this.callNext(login, 1);
      } else {
        const seconds = nobotUtils.getSeconds(
          emenyContainers.first().find('.enemy_detail > div').eq(1).find('span').eq(1).text()
        );
        const nextUrl = emenyContainers.first().find('.enemy_button > a').attr('href') as string;
        page = await makeMobileRequest(nextUrl, login, false);
        const form = page('#sp_sc_5').parent();
        this.logger.info('Start fight enemy for %s.', login);
        await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
        this.logger.info('Wait %d seconds to battle for %s', seconds, login);
        this.callNext(login, seconds);
      }
    } catch (err) {
      this.logger.error('Error while fighting emeny for %s.', login);
      this.logger.error(err);
      this.callNext(login, 1);
    }
  };

  private callNext = (login: string, seconds: number): void => {
    const interval = setTimeout(() => {
      this.startBattle(login);
    }, seconds * 1000);
    const task = this.battleTasks.get(login) as BattleTask;
    this.battleTasks.set(login, {
      ...task,
      interval
    });
  };
}
