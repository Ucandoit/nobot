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
import { AccountRepository, Task, TaskRepository, TaskStatus, TaskType } from '@nobot-core/database';
import he from 'he';
import { inject } from 'inversify';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';
import MapService from '../commons/map-service';

interface StoryTaskProperties {
  test: string;
}

interface StoryStatus {
  login: string;
  chapter: number;
  section: number;
  rank: number;
}

@Service()
export default class StoryService {
  private logger = getLogger(StoryService.name);

  @inject(MapService)
  private mapService: MapService;

  private accountRepository: AccountRepository;

  private taskRepository: TaskRepository<StoryTaskProperties>;

  private pauseTaskIntervalIdMap = new Map<string, NodeJS.Timeout>();

  private executeTaskIntervalIdMap = new Map<string, NodeJS.Timeout>();

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.taskRepository = connection.getCustomRepository(TaskRepository) as TaskRepository<StoryTaskProperties>;
  }

  startAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    executeConcurrent(
      accounts.map((account) => account.login),
      this.start,
      10
    );
  };

  stopAll = async (): Promise<void> => {
    const tasks = await this.taskRepository.findAllTasksByType(TaskType.STORY);
    await tasks.forEach(async (task) => {
      this.logger.info('Stop story task for %s.', task.account.login);
      await this.taskRepository.update(task.id, {
        endTime: new Date(),
        status: TaskStatus.END
      });
    });
  };

  start = async (login: string): Promise<void> => {
    try {
      const task = await this.taskRepository.findSingleTaskByAccountAndType(login, TaskType.STORY);
      if (task) {
        if (task.status === TaskStatus.RUNNING) {
          this.logger.info('War task is already in progress for %s', login);
        } else {
          this.logger.info('Resume story task for %s.', login);
          await this.taskRepository.update(task.id, {
            status: TaskStatus.RUNNING
          });
          this.clearIntervalIfExists(login, this.executeTaskIntervalIdMap);
          this.clearIntervalIfExists(login, this.pauseTaskIntervalIdMap);
          await this.executeTask(login);
        }
      } else {
        this.logger.info('Create new story task for %s.', login);
        await this.taskRepository.save({
          type: TaskType.STORY,
          status: TaskStatus.RUNNING,
          startTime: new Date(),
          properties: {},
          account: { login }
        });
        await this.executeTask(login);
      }
    } catch (err) {
      this.logger.error(err);
    }
  };

  stop = async (login: string): Promise<void> => {
    try {
      const task = await this.taskRepository.findSingleTaskByAccountAndType(login, TaskType.STORY);
      if (task) {
        this.logger.info('Stop story task for %s.', login);
        await this.taskRepository.update(task.id, {
          status: TaskStatus.END,
          endTime: new Date()
        });
        this.clearIntervalIfExists(login, this.executeTaskIntervalIdMap);
        this.clearIntervalIfExists(login, this.pauseTaskIntervalIdMap);
      } else {
        this.logger.warn('No running story task for %s.', login);
      }
    } catch (err) {
      this.logger.error(err);
    }
  };

  pause = async (login: string, taskToPause?: Task<StoryTaskProperties>): Promise<void> => {
    try {
      const task = taskToPause ?? (await this.taskRepository.findSingleTaskByAccountAndType(login, TaskType.STORY));
      if (task) {
        this.logger.info('Pause story task for %s for 6 hours.', login);
        await this.taskRepository.update(task.id, {
          status: TaskStatus.PAUSE
        });
        this.clearIntervalIfExists(login, this.executeTaskIntervalIdMap);
        this.clearIntervalIfExists(login, this.pauseTaskIntervalIdMap);
        const intervalId = setTimeout(() => {
          this.start(login);
        }, 6 * 60 * 60 * 1000);
        this.pauseTaskIntervalIdMap.set(login, intervalId);
      } else {
        this.logger.warn('No running story task for %s.', login);
      }
    } catch (err) {
      this.logger.error(err);
    }
  };

  getAllStatus = async (): Promise<StoryStatus[]> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    const allStatus: StoryStatus[] = [];
    await executeConcurrent(
      accounts.map((account) => account.login),
      async (login: string) => {
        allStatus.push(await this.getStatus(login));
      },
      20
    );
    return allStatus;
  };

  getStatus = async (login: string): Promise<StoryStatus> => {
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.CATTALE_PROGRESS, login);
    const main = page('#cattale-progress-main');
    const chapterSectionString = he.decode(main.html() as string).match(/第([0-9]+)章 第([0-9])幕/);
    const rankString = he.decode(main.html() as string).match(/(([0-9]|,)+)位/);
    if (chapterSectionString && rankString) {
      const [, chapter, section] = chapterSectionString as RegExpMatchArray;
      const [, rank] = rankString as RegExpMatchArray;
      return {
        login,
        chapter: +chapter,
        section: +section,
        rank: +rank.replace(',', '')
      };
    }
    throw new Error(`Unable to get status for ${login}`);
  };

  getChapterReward = async (login: string): Promise<void> => {
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.CATTALE_CHAPTER_REWARD, login);
    const forms = page('form[action*=chapter_reward_list]');
    if (forms.length) {
      forms.each(async (i) => {
        const form = forms.eq(i);
        await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
      });
    } else {
      this.logger.info('No more chapter rewards for %s.', login);
    }
  };

  private executeTask = async (login: string): Promise<void> => {
    const task = await this.taskRepository.findSingleTaskByAccountAndType(login, TaskType.STORY);
    try {
      if (task && task.status === TaskStatus.RUNNING) {
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
          return;
        }
        const currentFood = await this.mapService.convertFood(login, page);
        // TODO: calculate deck food based on deck cards
        const deckFood = 620;
        if (currentFood < deckFood) {
          this.logger.info('Not enough food for %s (current: %d).', login, currentFood);
          // TODO: implement add extract food ticket based on option
          await this.pause(login, task);
          return;
        }
        const mapPage = await getFinalPage(NOBOT_MOBILE_URL.AREA_MAP, login);
        const enemies = mapPage('.enemy_data_info');
        if (enemies.length > 0) {
          const enemy = enemies.first();
          const secondsText = regexUtils.catchByRegex(
            enemy.find('.enemy_detail').html() as string,
            /[0-9]{2}:[0-9]{2}:[0-9]{2}/
          ) as string | null;
          if (secondsText) {
            const seconds = nobotUtils.getSeconds(secondsText);
            const nextUrl = enemy.find('.enemy_button a').attr('href');
            if (nextUrl) {
              const confirmPage = await makeMobileRequest(nextUrl, login, false);
              const form = confirmPage('#sp_sc_5').parent();
              if (form.length > 0) {
                await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
                this.logger.info('Start story battle for %s with duration %d', login, seconds);
                this.waitForNext(login, seconds);
                return;
              }
              this.logger.error('No form found for %s.', login);
              await this.pause(login, task);
              return;
            }
            this.logger.error('No nextUrl found for %s, retry once.', login);
          } else {
            this.logger.error('No seconds found for %s, retry once.', login);
          }
        } else {
          this.logger.error('No enemy found for %s, retry once.', login);
        }
        this.waitForNext(login);
      } else {
        this.logger.warn('Task is not running any more for %s.', login);
      }
    } catch (err) {
      this.logger.error(err);
      // pause task when error
      if (task) {
        await this.pause(login, task);
      }
    }
  };

  private waitForNext = (login: string, seconds = 5): void => {
    const interval = setTimeout(() => {
      this.executeTask(login);
    }, seconds * 1000);
    this.executeTaskIntervalIdMap.set(login, interval);
  };

  private clearIntervalIfExists = (login: string, map: Map<string, NodeJS.Timeout>): void => {
    const intervalId = map.get(login);
    if (intervalId) {
      clearInterval(intervalId);
      map.delete(login);
    }
  };
}
