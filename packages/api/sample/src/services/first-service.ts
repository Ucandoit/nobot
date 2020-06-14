import { Service } from '@nobot-core/commons';
import { Account } from '@nobot-core/database';
import { Connection, Repository } from 'typeorm';

@Service()
export default class FirstService {
  private accountRepository: Repository<Account>;

  constructor(connection: Connection) {
    this.accountRepository = connection.getRepository<Account>('Account');
  }

  first = async (): Promise<void> => {
    const account = await this.accountRepository.findOne('ucandoit');
    console.log(account);
  };
}
