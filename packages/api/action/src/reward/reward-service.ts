import {
  executeConcurrent,
  makeMobileRequest,
  makePostMobileRequest,
  NOBOT_MOBILE_URL,
  Service
} from '@nobot-core/commons';
import { AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';

@Service()
export default class RewardService {
  private logger = getLogger(RewardService.name);

  private accountRepository: AccountRepository;

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
  }

  getAllItemboxReward = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    executeConcurrent(
      accounts.map((account) => account.login).filter((login) => login.startsWith('zzz')),
      this.getItemboxReward,
      10
    );
  };

  getItemboxReward = async (login: string): Promise<void> => {
    this.logger.info('Get itembox reward for %s.', login);
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.ITEMBOX, login);
    const form = page('#form-receive-all');
    await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
  };
}
