import { executeConcurrent, makeRequest, NOBOT_URL, regexUtils, Service } from '@nobot-core/commons';
import { Account } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { clearInterval } from 'timers';
import { Connection, MoreThan, Repository } from 'typeorm';
import StoryTask from './story-task';

@Service()
export default class StoryService {
  private logger = getLogger(StoryService.name);

  private tasks: StoryTask[] = [];

  private accountRepository: Repository<Account>;

  constructor(connection: Connection) {
    this.accountRepository = connection.getRepository<Account>('Account');
  }

  start = async (login: string, extraTicket = 0, mode = 'medium', seconds = 150): Promise<void> => {
    let task = this.tasks.find((t) => t.getLogin() === login);
    if (task === undefined) {
      task = new StoryTask(login, extraTicket, mode, seconds);
      this.tasks.push(task);
    } else if (task.isStop()) {
      task.setStop(false);
      task.setExtraTicket(extraTicket);
      task.setRetry(0);
      task.setMode(mode);
      task.setSeconds(seconds);
    }
    this.checkFight(login);
  };

  stop = (login: string): void => {
    this.logger.info('Stop story task for %s', login);
    const task = this.tasks.find((t) => t.getLogin() === login);
    if (task !== undefined) {
      task.setStop(true);
      const interval = task.getInterval();
      if (interval) {
        clearInterval(interval);
        task.setInterval(null);
      }
    }
  };

  getAllChapterReward = async (): Promise<void> => {
    const accounts = await this.accountRepository.find({
      where: {
        expirationDate: MoreThan(new Date()),
        mobile: false
      },
      order: {
        login: 'ASC'
      }
    });
    executeConcurrent(
      accounts.map((account) => account.login),
      this.getChapterReward,
      5
    );
  };

  getAllPointReward = async (): Promise<void> => {
    const accounts = await this.accountRepository.find({
      where: {
        expirationDate: MoreThan(new Date()),
        mobile: false
      },
      order: {
        login: 'ASC'
      }
    });
    executeConcurrent(
      accounts.map((account) => account.login),
      this.getPointReward,
      5
    );
  };

  private checkFight = async (login: string): Promise<void> => {
    const task = this.tasks.find((t) => t.getLogin() === login);
    if (task === undefined) {
      return;
    }
    if (task.isStop()) {
      this.logger.info('Task for %s is forced to stop.', login);
      return;
    }
    try {
      this.logger.info('Check fight for %s.', login);
      await makeRequest(NOBOT_URL.NOTIFY, 'POST', login, 'notify_flag_6=32');
      const mapPage = (await makeRequest(NOBOT_URL.MAP, 'GET', login)) as CheerioStatic;
      const currentFood = parseInt(mapPage('#element_food').text(), 10);
      // const currentFood = await this.convertToFood(mapPage, login);
      // const deckFood = await this.getDeckFood(login);
      const deckFood = 620;
      if (currentFood < deckFood) {
        this.logger.info('Not enough food for %s (current: %d).', login, currentFood);
        if (task.getExtraTicket() > 0) {
          this.logger.info('Using extra ticket for %s', login);
          await makeRequest(NOBOT_URL.CHARGE_FOOD, 'POST', login, 'kind=33');
          task.setExtraTicket(task.getExtraTicket() - 1);
          setTimeout(() => {
            this.checkFight(login);
          }, 1000);
        } else {
          this.logger.info('Stop task for %s', login);
          task.setStop(true);
        }
      } else if (mapPage('#move_1').length > 0) {
        this.logger.info('Still in battle for %s.', login);
        setTimeout(() => {
          this.checkFight(login);
        }, 1000);
      } else {
        const target = mapPage('.map_point_cte');
        if (target.length > 0) {
          this.logger.info('Target found for %s.', login);
          const detailId = target.parent().attr('id')?.replace('dialog', 'detail');
          const text = mapPage(`#${detailId} .quest_text`).text();
          const matcher = text.match(/([0-9]+).+([0-9]+)/);
          if (matcher) {
            const chapter = parseInt(matcher[1], 10);
            const section = parseInt(matcher[2], 10);
            task.setChapterAndSection(chapter, section);

            if (
              (chapter === 21 && section === 2) ||
              (chapter === 26 && section === 5) ||
              (chapter === 29 && section === 2) ||
              (chapter === 29 && section === 5) ||
              (chapter === 30 && section === 1) ||
              (chapter === 30 && section === 5)
            ) {
              this.logger.info('Difficult enemy, change teams for %s.', login);
              await this.changeTeams(login, 1);
              task.setTeam(1);
            } else if (chapter >= 20 && task.getTeam() !== 5) {
              this.logger.info('Change to team 5 for %s.', login);
              await this.changeTeams(login, 5);
              task.setTeam(5);
            } else if (chapter < 20 && task.getTeam() !== 4) {
              this.logger.info('Change to team 4 for %s.', login);
              await this.changeTeams(login, 4);
              task.setTeam(4);
            }
            // if (
            //   (chapter === 1 && section === 1) ||
            //   (chapter === 4 && section === 3) ||
            //   (chapter === 13 && section === 3) ||
            //   (chapter === 16 && section === 3)
            // ) {
            //   this.logger.info('Activating cattale fever for %s.', login);
            //   await makeRequest(NOBOT_URL.CATTALE_FEVER, 'POST', login, 'p=map');
            //   await makeRequest(NOBOT_URL.NOTIFY_BONUS, 'GET', login);
            //   await makeRequest(NOBOT_URL.MAP, 'GET', login);
            // }
            const seconds = this.getSeconds(mapPage(`#${detailId} .quest_info`).eq(5).text());
            const nextUrl = (await makeRequest(
              NOBOT_URL.MAP,
              'POST',
              login,
              mapPage(`#${detailId} form`).serialize()
            )) as string;
            const setUpPage = (await makeRequest(nextUrl, 'GET', login)) as CheerioStatic;
            await makeRequest(NOBOT_URL.BATTLE, 'POST', login, setUpPage('#command_ok form').serialize());
            this.logger.info(
              'Start battle chapter %d section %d for %s with duration %d',
              chapter,
              section,
              login,
              seconds
            );
            if (task.getMode() === 'fast' || (task.getMode() === 'medium' && seconds > task.getSeconds())) {
              this.logger.info('Quick move for %s.', login);
              await makeRequest(NOBOT_URL.FINISH_MOVE, 'POST', login, 'p=map');
              const interval = setTimeout(() => {
                this.checkFight(login);
              }, 100);
              task.setInterval(interval);
            } else {
              const interval = setTimeout(() => {
                this.checkFight(login);
              }, seconds * 1000);
              task.setInterval(interval);
            }
          } else {
            this.logger.warn('No chapter text for %s.', login);
            setTimeout(() => {
              this.checkFight(login);
            }, 5000);
          }
        } else {
          this.logger.warn('No target found for %s.', login);
          setTimeout(() => {
            this.checkFight(login);
          }, 1000);
        }
      }
    } catch (err) {
      this.logger.error(err);
      setTimeout(() => {
        this.checkFight(login);
      }, 5000);
    }
  };

  getStatus = async (login: string): Promise<boolean> => {
    const task = this.tasks.find((t) => t.getLogin() === login);
    return task !== undefined && !task.isStop();
  };

  private getSeconds = (text: string): number => {
    const [, minute, second] = text.split(':');
    return parseInt(minute, 10) * 60 + parseInt(second, 10);
  };

  public convertToFood = async (page: CheerioStatic, login: string): Promise<number> => {
    const currentFood = parseInt(page('#element_food').text(), 10);
    const currentFire = parseInt(page('#element_fire').text(), 10);
    const currentEarth = parseInt(page('#element_earth').text(), 10);
    const currentWind = parseInt(page('#element_wind').text(), 10);
    const currentWater = parseInt(page('#element_water').text(), 10);
    const currentSky = parseInt(page('#element_sky').text(), 10);
    if (currentFire > 3000 || currentEarth > 3000 || currentWind > 3000 || currentWater > 3000 || currentSky > 3000) {
      const convertedFood = (currentFire + currentEarth + currentWind + currentWater + currentSky) / 20;
      if (convertedFood > 0 && currentFood + convertedFood <= 7500) {
        const villagePage = (await makeRequest(NOBOT_URL.VILLAGE, 'GET', login)) as CheerioStatic;
        const tradeForm = villagePage('#trade-all-form');
        await makeRequest(tradeForm.attr('action') || NOBOT_URL.TRADE, 'POST', login, tradeForm.serialize());
        return currentFood + convertedFood;
      }
    }
    return currentFood;
  };

  public getDeckFood = async (login: string): Promise<number> => {
    const page = (await makeRequest(NOBOT_URL.MANAGE_DECK, 'GET', login)) as CheerioStatic;
    let food = 0;
    let count = 0;
    for (let i = 1; i <= 5; i++) {
      const card = page(`#deck-card${i}`);
      if (card.length > 0) {
        const cardId = regexUtils.catchByRegex(
          card.children('.card-face').attr('class'),
          /(?<=face-card-id)[0-9]+(?= )/
        );
        const cardInfo = page(`#data_form_card-data-id${cardId}`);
        if (cardInfo.length > 0) {
          food += parseInt((cardInfo.attr('value') as string).split(',')[8], 10);
          count += 1;
        }
      }
    }
    const deckFood = food / count;
    return deckFood > 620 ? 620 : deckFood;
  };

  public changeTeams = async (login: string, index: number): Promise<void> => {
    const page = (await makeRequest(
      `${NOBOT_URL.MANAGE_DECK}?display_deck_index=${index}`,
      'GET',
      login
    )) as CheerioStatic;
    const form = page('#form');
    await makeRequest(NOBOT_URL.MANAGE_DECK, 'POST', login, form.serialize());
  };

  public getChapterReward = async (login: string): Promise<void> => {
    await this.getReward(login, NOBOT_URL.CATTALE_CHAPTER_REWARD);
  };

  private getPointReward = async (login: string): Promise<void> => {
    await this.getReward(login, NOBOT_URL.CATTALE_POINT_REWARD);
  };

  private getReward = async (login: string, url: string): Promise<void> => {
    this.logger.info('Get cattale reward for %s.', login);
    const page = (await makeRequest(url, 'GET', login)) as CheerioStatic;
    const forms = page('#content table form');
    const postDatas: string[] = [];
    for (let i = 0; i < forms.length; i++) {
      const form = forms.eq(i);
      postDatas.push(form.serialize());
    }
    executeConcurrent(postDatas, this.claimReward, 1, url, login);
  };

  private claimReward = async (postData: string, url: string, login: string): Promise<void> => {
    const location = await makeRequest(url, 'POST', login, postData);
    if (typeof location === 'string' && location.includes('get_cattale_rental_card')) {
      const [nextUrl, params] = location.split('?');
      if (login.startsWith('zyk') || login.startsWith('zz')) {
        this.logger.info('Choose card recruit for %s.', login);
        await makeRequest(NOBOT_URL.CATTLE_RECRUIT, 'POST', login, params);
      } else {
        this.logger.info('Choose card reward for %s.', login);
        await makeRequest(nextUrl, 'POST', login, params);
      }
    }
  };
}
