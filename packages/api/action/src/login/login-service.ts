import { executeConcurrent, getFinalPage, NOBOT_MOBILE_URL, Service } from '@nobot-core/commons';
import { AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm/connection/Connection';

@Service()
export default class LoginService {
  private logger = getLogger(LoginService.name);

  private accountRepository: AccountRepository;

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
  }

  dailyLoginAll = async (): Promise<void> => {
    this.logger.info('Start daily login.');
    const accounts = await this.accountRepository.getMobileAccounts();
    await executeConcurrent(
      accounts.map((account) => account.login),
      this.dailyLogin,
      10
    );
    this.logger.info('Stop daily login.');
  };

  dailyLogin = async (login: string): Promise<void> => {
    this.logger.info('Daily login for %s.', login);
    try {
      await getFinalPage(NOBOT_MOBILE_URL.WORLD_LIST, login);
    } catch (err) {
      this.logger.error('Error while daily login for %s', login);
      this.logger.error(err);
    }
  };
}
