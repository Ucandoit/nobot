import { EntityRepository, FindManyOptions, MoreThan, Repository, SelectQueryBuilder } from 'typeorm';
import { Account, Status } from '../entities';

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

  getMobileAccountsByStatus = (status: Status): Promise<Account[]> => {
    return this.getAll({
      join: { alias: 'account', leftJoin: { accountConfig: 'account.accountConfig' } },
      where: (qb: SelectQueryBuilder<Account>) => {
        qb.where({
          expirationDate: MoreThan(new Date()),
          mobile: true
        }).andWhere('accountConfig.status = :status', { status });
      }
    });
  };

  getMobileAccountsNeedBattle = (): Promise<Account[]> => {
    return this.getAll({
      join: { alias: 'account', leftJoin: { accountConfig: 'account.accountConfig' } },
      where: (qb: SelectQueryBuilder<Account>) => {
        qb.where({
          expirationDate: MoreThan(new Date()),
          mobile: true
        })
          .andWhere('accountConfig.status = :status', { status: 'FINISH' })
          .andWhere('accountConfig.battleClear = false');
      }
    });
  };

  getMobileAccountsNeedRefine = (): Promise<Account[]> => {
    return this.getAll({
      join: { alias: 'account', leftJoin: { accountConfig: 'account.accountConfig' } },
      where: (qb: SelectQueryBuilder<Account>) => {
        qb.where({
          expirationDate: MoreThan(new Date()),
          mobile: true
        })
          .andWhere('accountConfig.status = :status', { status: 'FINISH' })
          .andWhere('accountConfig.refineClear = false');
      }
    });
  };

  getMobileAccountsNeedCountryBattle = (): Promise<Account[]> => {
    return this.getAll({
      join: { alias: 'account', leftJoin: { accountConfig: 'account.accountConfig' } },
      where: (qb: SelectQueryBuilder<Account>) => {
        qb.where({
          expirationDate: MoreThan(new Date()),
          mobile: true
        })
          .andWhere('accountConfig.status = :status', { status: 'FINISH' })
          .andWhere('accountConfig.wrestleClear = false');
      }
    });
  };
}
