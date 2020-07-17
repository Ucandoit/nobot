import { Service } from '@nobot-core/commons';
import { AccountRepository, WarConfigRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';

@Service()
export default class WarConfigService {
  private logger = getLogger(WarConfigService.name);

  private warConfigRepository: WarConfigRepository;

  private accountRepository: AccountRepository;

  constructor(connection: Connection) {
    this.warConfigRepository = connection.getCustomRepository(WarConfigRepository);
    this.accountRepository = connection.getCustomRepository(AccountRepository);
  }

  initializeWarConfigs = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccountsReady();
    accounts.forEach(async (account) => {
      const warConfig = await this.warConfigRepository.findOne(account.login);
      if (!warConfig) {
        this.logger.info('Create war config for %s.', account.login);
        this.warConfigRepository.save({
          login: account.login,
          group: 'BASIC'
        });
      }
    });
  };
}
