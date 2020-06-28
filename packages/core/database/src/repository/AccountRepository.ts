import { EntityRepository, MoreThan, Repository } from 'typeorm';
import { Account } from '../entities';

@EntityRepository(Account)
export default class CardRepository extends Repository<Account> {
  getLastMobileAccount = (): Promise<{ [key: string]: string }> => {
    const query = this.createQueryBuilder('account')
      .select('account.login', 'login')
      .orderBy('account.login', 'DESC')
      .where('account.mobile=true')
      .take(1);
    return query.getRawOne();
  };

  getMobileAccounts = (): Promise<Account[]> => {
    return this.find({
      where: {
        expirationDate: MoreThan(new Date()),
        mobile: true
      },
      order: {
        login: 'ASC'
      }
    });
  };
}
