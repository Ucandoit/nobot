import { AuctionHistory } from '@nobot-core/database';
import { getConnection, Repository } from 'typeorm';

class AuctionHistoryService {
  private auctionHistoryRepository: Repository<AuctionHistory>;

  save = (auctionHistory: AuctionHistory): Promise<AuctionHistory> => {
    return this.getRepository().save(auctionHistory);
  };

  private getRepository = (): Repository<AuctionHistory> => {
    if (!this.auctionHistoryRepository) {
      this.auctionHistoryRepository = getConnection().getRepository<AuctionHistory>('AuctionHistory');
    }
    return this.auctionHistoryRepository;
  };
}

export default new AuctionHistoryService();
