import { EntityRepository, Repository, SelectQueryBuilder } from 'typeorm';
import { AuctionConfig } from '../entities';

@EntityRepository(AuctionConfig)
export default class AuctionConfigRepository extends Repository<AuctionConfig> {
  getEnabledAuctionConfigs = (): Promise<AuctionConfig[]> => {
    return this.find({
      join: {
        alias: 'auctionConfig',
        leftJoin: {
          account: 'auctionConfig.account'
        }
      },
      where: (qb: SelectQueryBuilder<AuctionConfig>) => {
        qb.where('auctionConfig.enabled = true')
          .andWhere('account.expirationDate >= :date', {
            date: new Date()
          })
          .andWhere('account.mobile = true');
      },
      order: {
        login: 'ASC'
      }
    });
  };

  getAll = (): Promise<AuctionConfig[]> => {
    return this.find({
      order: {
        login: 'ASC'
      }
    });
  };
}
