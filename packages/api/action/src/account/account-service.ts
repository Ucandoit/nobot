import {
  executeConcurrent,
  getFinalPage,
  makeMobileRequest,
  makePostMobileRequest,
  NOBOT_MOBILE_URL,
  regexUtils,
  Service
} from '@nobot-core/commons';
import { AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm/connection/Connection';

interface AccountLevel {
  record: number;
  wrestle: number;
  war: number;
  battle: number;
  draw: number;
  upgrade: number;
}

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

  recruit = async (recruiter: string, candidate: string): Promise<void> => {
    const account = await this.accountRepository.findOne(recruiter);
    if (account && account.recruitId) {
      await makePostMobileRequest(NOBOT_MOBILE_URL.FRIEND_CODE, candidate, `friendCode=${account.recruitId}`);
      this.logger.info('Recruit %s by %s.', candidate, recruiter);
    } else {
      this.logger.warn('Account %s not found or does not have recruit id.', recruiter);
    }
  };

  checkAllAuctionRequirement = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    executeConcurrent(
      accounts.map((account) => account.login).filter((login) => login.startsWith('zz0')),
      this.checkAuctionRequirement,
      10
    );
  };

  checkAuctionRequirement = async (login: string): Promise<void> => {
    const accountLevel: AccountLevel = {
      record: 0,
      wrestle: 0,
      war: 0,
      battle: 0,
      draw: 0,
      upgrade: 0
    };
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.PROFILE, login);
    const rows = page('#main > div').eq(4).find('table tr');
    rows.each((i) => {
      const text = rows.eq(i).text();
      const level = regexUtils.catchByRegexAsNumber(text, /(?<=Lv)[0-9]+/) || 0;
      if (text.includes('戦績')) {
        accountLevel.record = level;
      } else if (text.includes('対戦')) {
        accountLevel.wrestle = level;
      } else if (text.includes('合戦')) {
        accountLevel.war = level;
      } else if (text.includes('討伐')) {
        accountLevel.battle = level;
      } else if (text.includes('くじ')) {
        accountLevel.draw = level;
      } else if (text.includes('強化')) {
        accountLevel.upgrade = level;
      }
    });
    this.logger.info('Account level for %s: %s', login, accountLevel);
  };
}
