import { executeConcurrent, NobotTask, Service } from '@nobot-core/commons';
import { AccountRepository } from '@nobot-core/database';
import { inject } from 'inversify';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';
import MapService from '../commons/map-service';

@Service()
export default class StoryService {
  private logger = getLogger(StoryService.name);

  @inject(MapService)
  private mapService: MapService;

  private accountRepository: AccountRepository;

  private storyTasks: Map<string, NobotTask>;

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
  }

  startAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    executeConcurrent(
      accounts.map((account) => account.login),
      this.start,
      10
    );
  };

  start = async (login: string): Promise<void> => {
    const task = this.storyTasks.get(login);
    if (task && task.start) {
      this.logger.info('Story task is already in progress for %s.', login);
    } else {
      this.storyTasks.set(login, { start: true });
      this.logger.info('Start to territory battle for %s', login);
      await this.startStory(login);
    }
  };

  startStory = async (login: string): Promise<void> => {
    this.logger.info('Start story for %s.', login);
  };
}
