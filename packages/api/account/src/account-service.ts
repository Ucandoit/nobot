import { executeConcurrent, getFinalPage, NOBOT_MOBILE_URL, Service } from '@nobot-core/commons';
import { Account, AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm/connection/Connection';

@Service()
export default class AccountService {
  private logger = getLogger(AccountService.name);

  private accountRepository: AccountRepository;

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
  }

  getAll = (): Promise<Account[]> => {
    return this.accountRepository.find({
      order: {
        login: 'ASC'
      }
    });
  };

  getLastMobileAccount = async (): Promise<string> => {
    const account = await this.accountRepository.getLastMobileAccount();
    return account.login;
  };

  create = (account: Partial<Account>): Promise<Account> => {
    return this.accountRepository.save(account);
  };

  updateNp = async (): Promise<number> => {
    this.logger.info('Start update np.');
    const accounts = await this.accountRepository.getMobileAccounts();
    await executeConcurrent(
      accounts,
      async (account: Account) => {
        const page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, account.login);
        const np = parseInt(page('span#lottery_point').text(), 10);
        await this.accountRepository.update(account.login, { np });
      },
      10
    );
    this.logger.info('Stop update np.');
    return this.calculateNp();
  };

  calculateNp = async (): Promise<number> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    return accounts.reduce((total: number, account: Account) => total + account.np, 0);
  };
}
