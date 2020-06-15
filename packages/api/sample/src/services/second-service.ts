import { Service } from '@nobot-core/commons';
import { Connection, Repository } from 'typeorm';

@Service()
export default class SecondService {
  private accountRepository: Repository<Account>;

  constructor(connection: Connection) {
    this.accountRepository = connection.getRepository<Account>('Account');
  }

  second = async (): Promise<void> => {
    const account = await this.accountRepository.findOne('ucandoit');
    console.log(account);
  };
}
