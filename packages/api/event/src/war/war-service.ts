import {
  executeConcurrent,
  getFinalPage,
  makeMobileRequest,
  makePostMobileRequest,
  NobotTask,
  NOBOT_MOBILE_URL,
  Service
} from '@nobot-core/commons';
import { AccountRepository, WarConfig, WarConfigRepository } from '@nobot-core/database';
import axios from 'axios';
import he from 'he';
import { inject } from 'inversify';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';
import MapService from '../commons/map-service';

@Service()
export default class WarService {
  private logger = getLogger(WarService.name);

  @inject(MapService)
  private mapService: MapService;

  private accountRepository: AccountRepository;

  private warConfigRepository: WarConfigRepository;

  private warTasks = new Map<string, NobotTask>();

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.warConfigRepository = connection.getCustomRepository(WarConfigRepository);
  }

  initWarParams = async (): Promise<void> => {
    const account = await this.accountRepository.getLastMobileAccount();
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.AREA_MAP, account.login);
    const divs = page('#main > div');
    for (let i = 0; i < divs.length; i++) {
      const div = divs.eq(i);
      if (he.decode(div.html() as string).includes('合戦が発生')) {
        this.logger.info(he.decode(div.html() as string));
        const warFields = div
          .find('b')
          .map((index, field) => field.firstChild.nodeValue)
          .get();
        this.logger.info(warFields);
        break;
      }
    }
  };

  checkWar = async (): Promise<void> => {
    const warConfigs = await this.warConfigRepository.find();
    await executeConcurrent(
      warConfigs.map((warConfig) => warConfig.login),
      async (login: string) => {
        await this.checkWarByLogin(login);
      },
      10
    );
  };

  checkWarByLogin = async (login: string): Promise<void> => {
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.AREA_MAP, login);
    const warFieldButtons = page('img[class^=event_move]');
    if (warFieldButtons.length === 2) {
      const warFields = [];
      for (let i = 0; i < warFieldButtons.length; i++) {
        const button = warFieldButtons.eq(i);
        const id = parseInt(button.attr('class')?.replace('event_move', '') as string, 10);
        const name = button.parent().prev().prev().prev().find('center').eq(1).text().replace('の合戦', '');
        warFields.push({ id, name });
      }
      this.logger.info(warFields);
    } else {
      const warField = page('a[href*="war_entry"]').parent().prev().find('center').eq(1).text().replace('の合戦', '');
      this.logger.info(warField);
      const warPage = await makeMobileRequest(NOBOT_MOBILE_URL.WAR_ENTRY, login);
      const entries = warPage('a[href*="entry_war"]');
      if (entries.length > 0) {
        this.logger.info({
          warField: '',
          warHost: ''
        });
      } else {
        const lines = warPage('a[href*="entry_btl"]');
        this.logger.info(lines.length);
        this.logger.info('Arrive at war field for %s.', login);
      }
    }
  };

  goToWarFieldByGroup = async (group: string, warFieldId: number): Promise<void> => {
    const warConfigs = await this.warConfigRepository.findByGroup(group);
    await executeConcurrent(
      warConfigs.map((warConfig) => warConfig.login),
      async (login: string) => {
        await this.goToWarField(login, warFieldId);
      },
      10
    );
  };

  goToWarField = async (login: string, warFieldId: number): Promise<void> => {
    const page = await makePostMobileRequest(NOBOT_MOBILE_URL.MAP_MOVE, login, `id=${warFieldId}`);
    const form = page('#sp_sc_5').parent();
    await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
    this.logger.info('Go to war field %d for %s', warFieldId, login);
  };

  chooseWarHostByGroup = async (group: string, countryId: number): Promise<void> => {
    const warConfigs = await this.warConfigRepository.findByGroup(group);
    await executeConcurrent(
      warConfigs.map((warConfig) => warConfig.login),
      async (login: string) => {
        await this.chooseWarHost(login, countryId);
      },
      10
    );
  };

  chooseWarHost = async (login: string, countryId: number): Promise<void> => {
    await makeMobileRequest(NOBOT_MOBILE_URL.WAR_ENTRY, login);
    const page = await makeMobileRequest(
      encodeURIComponent(`${NOBOT_MOBILE_URL.WAR_CONFIRM}?action=entry_war&target=${countryId}`),
      login
    );
    const form = page('#sp_sc_5').parent();
    await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
    this.logger.info('Choose war host %d for %s', countryId, login);
  };

  startAll = async (): Promise<void> => {
    const warConfigs = await this.warConfigRepository.findEnabled();
    executeConcurrent(
      warConfigs.map((warConfig) => warConfig.login),
      async (login: string) => {
        await this.start(login);
      },
      10
    );
  };

  stopAll = async (): Promise<void> => {
    Array.from(this.warTasks.keys()).forEach((login) => {
      this.stop(login);
    });
  };

  startByGroup = async (group: string): Promise<void> => {
    const warConfigs = await this.warConfigRepository.findByGroup(group);
    executeConcurrent(
      warConfigs,
      async (warConfig: WarConfig) => {
        if (warConfig.enable) {
          await this.start(warConfig.login);
        }
      },
      10
    );
  };

  stopByGroup = async (group: string): Promise<void> => {
    const warConfigs = await this.warConfigRepository.findByGroup(group);
    warConfigs.forEach((warConfig) => {
      this.stop(warConfig.login);
    });
  };

  start = async (login: string): Promise<void> => {
    const task = this.warTasks.get(login);
    if (task && task.start) {
      this.logger.info('War task is already in progress for %s', login);
    } else {
      this.warTasks.set(login, { start: true });
      this.logger.info('Start war for %s', login);
      try {
        await this.startWar(login);
      } catch (err) {
        this.logger.info('error while starting war for %s.', login);
        this.logger.info(err);
        this.waitForNext(login);
      }
    }
  };

  stop = (login: string): void => {
    this.logger.info('Stop war for %s', login);
    const task = this.warTasks.get(login);
    if (task && task.interval) {
      clearInterval(task.interval);
    }
    this.warTasks.delete(login);
  };

  completePreQuestsByGroup = async (group: string): Promise<void> => {
    this.completeQuestsByGroup(group, [54, 94]);
  };

  completeWarQuestsByGroup = async (group: string): Promise<void> => {
    this.completeQuestsByGroup(group, [139, 158, 218, 219, 181, 182]);
  };

  private completeQuestsByGroup = async (group: string, questIds: number[]): Promise<void> => {
    const warConfigs = await this.warConfigRepository.findByGroup(group);
    await executeConcurrent(
      warConfigs.map((warConfig) => warConfig.login),
      async (login: string) => {
        await executeConcurrent(
          questIds,
          async (questId: number) => {
            this.logger.info('Complete quest %d for %s.', questId, login);
            await axios.get(`http://action:3000/action/quest/complete?login=${login}&quest=${questId}`);
          },
          1
        );
      },
      10
    );
  };

  private startWar = async (login: string): Promise<void> => {
    const warConfig = await this.warConfigRepository.findOne(login);
    if (warConfig && warConfig.enable) {
      let page: CheerioStatic | undefined;
      let villagePage = false;
      // loop until get to final village page
      while (!villagePage) {
        // eslint-disable-next-line no-await-in-loop
        page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
        villagePage = page('#village_top_main').length > 0;
      }
      const inAction = await this.mapService.checkInAction(login, page);
      if (inAction) {
        this.logger.info('Still in action for %s.', login);
        this.waitForNext(login);
      } else {
        const currentFood = await this.mapService.convertFood(login, page);
        page = await makeMobileRequest(NOBOT_MOBILE_URL.MANAGE_DECK, login);
        let deckFood = parseInt(page('.food').text(), 10);
        if (warConfig.fp || warConfig.npc) {
          deckFood *= 3;
        }
        if (deckFood <= currentFood) {
          page = await makeMobileRequest(NOBOT_MOBILE_URL.WAR_ENTRY, login);
          const lines = page('a[href*="entry_btl"]');
          const lastDay = lines.length === 1;
          if (!lastDay) {
            const willGain = this.foodTilNextDay();
            this.logger.info('%s will gain %d food til next day.', login, willGain);
            if (currentFood + willGain < 7500) {
              this.logger.info('Short in food for next day %s.', login);
              this.stop(login);
              return;
            }
          }
          const line = lastDay ? lines.eq(0).attr('href') : lines.eq(warConfig.line - 1).attr('href');
          page = await makeMobileRequest(line as string, login, false);
          // confirm entry
          let form = page('#sp_sc_5').parent();
          const entryUrl = form.attr('action') as string;
          page = await makePostMobileRequest(entryUrl, login, form.serialize(), false);
          // confirm start
          try {
            form = page('#sp_sc_5').parent();
            let postData = form.serialize();
            if (warConfig.fp) {
              postData = postData.replace('fp=0', 'fp=1');
            } else if (lastDay && warConfig.npc) {
              postData += '&npc=1';
            }
            await makePostMobileRequest(form.attr('action') as string, login, postData, false);
          } catch (err) {
            // retry once if error
            page = await makePostMobileRequest(entryUrl, login, form.serialize(), false);
            form = page('#sp_sc_5').parent();
            let postData = form.serialize();
            if (warConfig.fp) {
              postData = postData.replace('fp=0', 'fp=1');
            } else if (lastDay && warConfig.npc) {
              postData += '&npc=1';
            }
            await makePostMobileRequest(form.attr('action') as string, login, postData, false);
          }
          this.logger.info(
            'Set up war for %s at line %d, npc: %s, pc: %s, fp: %s',
            login,
            warConfig.line,
            warConfig.npc && lastDay,
            warConfig.pc,
            warConfig.fp
          );
          this.waitForNext(login);
        } else {
          this.logger.info('Short in food (%d/%d) for %s. Recheck 1 hour later.', deckFood, currentFood, login);
          this.waitForNext(login, 3600);
        }
      }
    } else {
      this.logger.warn('No war config found or not enabled for %s.', login);
      this.stop(login);
    }
  };

  private waitForNext = (login: string, seconds = 120): void => {
    const interval = setTimeout(() => {
      this.startWar(login);
    }, seconds * 1000);
    const task = this.warTasks.get(login) as NobotTask;
    this.warTasks.set(login, {
      ...task,
      interval
    });
  };

  private foodTilNextDay = (): number => {
    const now = new Date();
    const nextDay = new Date();
    if (nextDay.getHours() >= 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    nextDay.setHours(6);
    nextDay.setMinutes(0);
    nextDay.setSeconds(0);
    const diff = nextDay.getTime() - now.getTime();
    return Math.floor((310 * diff) / 3600000);
  };
}
