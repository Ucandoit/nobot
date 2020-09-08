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
import { AccountRepository, TaskRepository, TaskStatus, TaskType } from '@nobot-core/database';
import { inject } from 'inversify';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';
import MapService from '../commons/map-service';

interface StoryTaskProperties {
  test: string;
}

@Service()
export default class StoryService {
  private logger = getLogger(StoryService.name);

  @inject(MapService)
  private mapService: MapService;

  private accountRepository: AccountRepository;

  private taskRepository: TaskRepository<StoryTaskProperties>;

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
      } else {
        this.logger.warn('No running story task for %s.', login);
      }
    } catch (err) {
      this.logger.error(err);
    }
  };

  pause = async (login: string): Promise<void> => {
    try {
      const task = await this.taskRepository.findSingleTaskByAccountAndType(login, TaskType.STORY);
      if (task) {
        this.logger.info('Pause story task for %s.', login);
        await this.taskRepository.update(task.id, {
          status: TaskStatus.PAUSE
        });
      } else {
        this.logger.warn('No running story task for %s.', login);
      }
    } catch (err) {
      this.logger.error(err);
    }
  };

  executeTask = async (login: string): Promise<void> => {
    const task = await this.taskRepository.findSingleTaskByAccountAndType(login, TaskType.STORY);
    try {
      if (task && task.status === TaskStatus.RUNNING) {
        // TODO: review this while loop
        // first request returns map page
        let page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
        // loop until get to final village page
        while (page('#mainmap').length > 0 || page('#village_top_main').length === 0) {
          // eslint-disable-next-line no-await-in-loop
          page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
        }
        const inAction = await this.mapService.checkInAction(login, page);
        if (inAction) {
          this.logger.info('Still in action for %s.', login);
          setTimeout(() => {
            this.executeTask(login);
          }, 5000);
          return;
        }
        const currentFood = await this.mapService.convertFood(login, page);
        // TODO: calculate deck food based on deck cards
        const deckFood = 620;
        if (currentFood < deckFood) {
          this.logger.info('Not enough food for %s (current: %d).', login, currentFood);
          // TODO: implement add extract food ticket based on option
          this.logger.info('Pause task for %s', login);
          await this.taskRepository.update(task.id, {
            status: TaskStatus.PAUSE
          });
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
                setTimeout(() => {
                  this.executeTask(login);
                }, seconds * 1000);
                return;
              }
              this.logger.error('No form found for %s.', login);
              await this.taskRepository.update(task.id, {
                status: TaskStatus.PAUSE
              });
              return;
            }
            this.logger.error('No nextUrl found for %s, retry once.', login);
          } else {
            this.logger.error('No seconds found for %s, retry once.', login);
          }
        } else {
          this.logger.error('No enemy found for %s, retry once.', login);
        }
        setTimeout(() => {
          this.executeTask(login);
        }, 5000);
      } else {
        this.logger.warn('Task is not running any more for %s.', login);
        // TODO: stop
      }
    } catch (err) {
      this.logger.error(err);
      // pause task when error
      if (task) {
        await this.taskRepository.update(task.id, {
          status: TaskStatus.PAUSE
        });
      }
    }
  };
}
