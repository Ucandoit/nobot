import { NotFoundException, Service } from '@nobot-core/commons';
import { AccountConfig, AccountConfigRepository, AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';

@Service()
export default class AccountConfigService {
  private logger = getLogger(AccountConfigService.name);

  private accountRepository: AccountRepository;

  private accountConfigRepository: AccountConfigRepository;

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.accountConfigRepository = connection.getCustomRepository(AccountConfigRepository);
  }

  public getAccountConfigs = (
    page?: number,
    size?: number,
    sort?: string,
    order?: 'ASC' | 'DESC',
    filters?: Partial<AccountConfig>
  ): Promise<[AccountConfig[], number]> => {
    return this.accountConfigRepository.findAll(page, size, sort, order, filters);
  };

  initializeAccountConfigs = async (): Promise<void> => {
    const accounts = await this.accountRepository.getAll({
      relations: ['accountConfig']
    });
    accounts.forEach(async (account) => {
      if (!account.accountConfig) {
        this.logger.info('Create account config for %s', account.login);
        await this.accountConfigRepository.save({
          login: account.login
        });
      }
    });
  };

  patchAccountConfig = async (login: string, data: Partial<AccountConfig>): Promise<AccountConfig> => {
    const accountConfig = await this.accountConfigRepository.findOne(login);
    if (accountConfig) {
      return this.accountConfigRepository.save({
        ...accountConfig,
        ...data
      });
    }
    this.logger.error('Account config not found for %s.', login);
    throw new NotFoundException();
  };
}
