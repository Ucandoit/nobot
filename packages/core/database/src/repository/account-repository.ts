import { EntityRepository, FindManyOptions, MoreThan, Repository, SelectQueryBuilder } from 'typeorm';
import { Account } from '../entities';

@EntityRepository(Account)
export default class CardRepository extends Repository<Account> {
  getAll = (options: FindManyOptions<Account> = {}): Promise<Account[]> => {
    return this.find({
      order: {
        login: 'ASC'
      },
      ...options
    });
  };

  getAllActiveAccounts = (): Promise<Account[]> => {
    return this.getAll({
      where: {
        expirationDate: MoreThan(new Date())
      }
    });
  };

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

  getMobileAccountsNeedBuilding = (): Promise<Account[]> => {
    return this.getAll({
      join: { alias: 'account', leftJoin: { accountConfig: 'account.accountConfig' } },
      where: (qb: SelectQueryBuilder<Account>) => {
        qb.where({
          expirationDate: MoreThan(new Date()),
          mobile: true
        }).andWhere('accountConfig.building = :building', { building: true });
      }
    });
  };

  getMobileAccountsNeedTraining = (): Promise<Account[]> => {
    return this.getAll({
      join: { alias: 'account', leftJoin: { accountConfig: 'account.accountConfig' } },
      where: (qb: SelectQueryBuilder<Account>) => {
        qb.where({
          expirationDate: MoreThan(new Date()),
          mobile: true
        })
          // building has to be false in order to start training
          .andWhere('accountConfig.building = :building', { building: false })
          .andWhere('accountConfig.training = :training', { training: true });
      }
    });
  };

  getMobileAccountsReady = (): Promise<Account[]> => {
    return this.getAll({
      join: { alias: 'account', leftJoin: { accountConfig: 'account.accountConfig' } },
      where: (qb: SelectQueryBuilder<Account>) => {
        qb.where({
          expirationDate: MoreThan(new Date()),
          mobile: true
        })
          .andWhere('accountConfig.building = :building', { building: false })
          .andWhere('accountConfig.training = :training', { training: false });
      }
    });
  };
}
