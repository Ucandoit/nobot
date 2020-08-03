import {
  executeConcurrent,
  getFinalPage,
  makeMobileRequest,
  makePostMobileRequest,
  NOBOT_MOBILE_URL,
  Service
} from '@nobot-core/commons';
import { AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm/connection/Connection';

@Service()
export default class AccountService {
  private logger = getLogger(AccountService.name);

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

  comebackAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    await executeConcurrent(
      accounts.map((account) => account.login),
      this.comeback,
      1
    );
  };

  comeback = async (login: string): Promise<void> => {
    let times = 0;
    while (times < 3) {
      // eslint-disable-next-line no-await-in-loop
      const page = await makeMobileRequest(NOBOT_MOBILE_URL.COMEBACK_LIST, login);
      const profiles = page('a[href*="mobile_profile.htm%3Fview"]');
      let i = 0;
      while (times < 3 && i < profiles.length) {
        // eslint-disable-next-line no-await-in-loop
        const result = await this.canComeback(profiles.eq(i).attr('href') as string, login);
        if (result) {
          this.logger.info('Call comeback for %s.', login);
          times += 1;
        }
        i += 1;
      }
    }
  };

  private canComeback = async (url: string, login: string): Promise<boolean> => {
    const page = await makeMobileRequest(url, login, false);
    const nextUrl = page('#nya_dest').next().find('a').eq(1).attr('href');
    if (nextUrl?.includes('mobile_comeback_confirm')) {
      const confirmPage = await makeMobileRequest(nextUrl, login, false);
      const form = confirmPage('form');
      await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
      return true;
    }
    return false;
  };
}
