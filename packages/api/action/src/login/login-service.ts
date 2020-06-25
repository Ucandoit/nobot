import { executeConcurrent, makeMobileRequest, NOBOT_MOBILE_URL, Service } from '@nobot-core/commons';
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
      await this.getFinalPage(login, NOBOT_MOBILE_URL.WORLD_LIST);
    } catch (err) {
      this.logger.error('Error while daily login for %s', login);
      this.logger.error(err);
    }
  };

  private getFinalPage = async (login: string, url: string, needPrefix = true): Promise<CheerioStatic> => {
    const page = await makeMobileRequest(url, login, needPrefix);
    const nextUrl = page('#sp_sc_5').attr('href');
    if (nextUrl) {
      return this.getFinalPage(login, nextUrl, false);
    }
    return page;
  };
}
