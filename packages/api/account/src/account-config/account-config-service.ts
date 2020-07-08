import { Service } from '@nobot-core/commons';
import { AccountConfig, AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection, Repository } from 'typeorm';

@Service()
export default class AccountConfigService {
  private logger = getLogger(AccountConfigService.name);

  private accountRepository: AccountRepository;

  private accountConfigRepository: Repository<AccountConfig>;

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.accountConfigRepository = connection.getRepository<AccountConfig>('AccountConfig');
  }

  initializeAccountConfigs = async (): Promise<void> => {
    const accounts = await this.accountRepository.getAll({
      relations: ['accountConfig']
    });
    accounts.forEach((account) => {
      if (!account.accountConfig) {
        this.logger.info('Create account config for %s', account.login);
        this.accountConfigRepository.save({
          login: account.login
        });
      }
    });
  };
}
