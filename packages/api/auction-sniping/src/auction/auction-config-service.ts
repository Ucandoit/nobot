import { AuctionConfig } from '@nobot-core/database';
import { getConnection, SelectQueryBuilder } from 'typeorm';

class AuctionConfigService {
  getAuctionConfigs = (): Promise<AuctionConfig[]> => {
    return getConnection()
      .getRepository<AuctionConfig>('AuctionConfig')
      .find({
        join: {
          alias: 'auctionConfig',
          leftJoin: {
            account: 'auctionConfig.account'
          }
        },
        where: (qb: SelectQueryBuilder<AuctionConfig>) => {
          qb.where('auctionConfig.enabled = :enabled', {
            enabled: true
          }).andWhere('account.expirationDate >= :date', {
            date: new Date()
          });
        }
      });
  };
}

export default new AuctionConfigService();
