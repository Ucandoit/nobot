import { executeConcurrent, getFinalPage, makePostMobileRequest, NOBOT_MOBILE_URL, Service } from '@nobot-core/commons';
import { Account, AccountRepository } from '@nobot-core/database';
import axios from 'axios';
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
        try {
          const np = await this.getNp(account.login);
          await this.accountRepository.update(account.login, { np });
        } catch (err) {
          this.logger.error(err);
        }
      },
      30
    );
    this.logger.info('Stop update np.');
    return this.calculateNp();
  };

  calculateNp = async (): Promise<number> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    return accounts.reduce((total: number, account: Account) => total + account.np, 0);
  };

  tradeNp = async (buyer: string, seller: string): Promise<void> => {
    this.logger.info('trade np from %s to %s.', buyer, seller);
    try {
      const np = await this.getNp(buyer);
      const tradeId = await this.postTradeCard(seller, np);
      await this.buyCard(buyer, tradeId);
    } catch (err) {
      this.logger.error(err);
    }
  };

  private getNp = async (login: string): Promise<number> => {
    const page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
    const np = parseInt(page('span#lottery_point').text(), 10);
    if (Number.isNaN(np)) {
      throw new Error(`Error while update np for ${login}.`);
    }
    return np;
  };

  private postTradeCard = async (login: string, price: number): Promise<string> => {
    const page = await makePostMobileRequest(
      `${NOBOT_MOBILE_URL.MANAGE_CARDS}`,
      login,
      'limit_rank=2&status=2&sell_card=1'
    );
    const sell = page('a[onclick^=sellCard]').first();
    if (sell.length > 0) {
      const onclickString = sell.attr('onclick');
      const [, fileId, cardIndex] = onclickString?.match(/^sellCard\(([0-9]+).([0-9]+)/) as RegExpMatchArray;
      const res = await axios.post('http://action:3000/action/sell/stored', {
        login,
        fileId,
        cardIndex,
        price,
        term: 1
      });
      this.logger.info('card posted for %d by %s.', price, login);
      return res.data;
    }
    throw new Error(`Impossible to find card to sell for ${login}.`);
  };

  private buyCard = async (login: string, tradeId: string): Promise<void> => {
    await makePostMobileRequest(NOBOT_MOBILE_URL.TRADE_BUY, login, `trade_id=${tradeId}&select=yes&catev=0`);
    this.logger.info('Card bought by %s.', login);
  };
}
