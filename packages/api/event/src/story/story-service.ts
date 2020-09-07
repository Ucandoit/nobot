import { executeConcurrent, Service } from '@nobot-core/commons';
import { AccountRepository, TaskRepository, TaskStatus, TaskType } from '@nobot-core/database';
// import { inject } from 'inversify';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';
// import MapService from '../commons/map-service';

interface StoryTaskProperties {
  test: string;
}

@Service()
export default class StoryService {
  private logger = getLogger(StoryService.name);

  // @inject(MapService)
  // private mapService: MapService;

  private accountRepository: AccountRepository;

  private taskRepository: TaskRepository<StoryTaskProperties>;

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.taskRepository = connection.getCustomRepository(TaskRepository) as TaskRepository<StoryTaskProperties>;
  }

  startAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    executeConcurrent(
      accounts.map((account) => account.login).filter((login) => login.startsWith('zzz_00')),
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

  executeTask = async (login: string): Promise<void> => {
    try {
      const task = await this.taskRepository.findSingleTaskByAccountAndType(login, TaskType.STORY);
      this.logger.info(task?.properties);
    } catch (err) {
      this.logger.error(err);
    }
  };
}
