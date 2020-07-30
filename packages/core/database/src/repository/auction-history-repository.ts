import { EntityRepository, Repository } from 'typeorm';
import { AuctionHistory } from '../entities';

@EntityRepository(AuctionHistory)
export default class AuctionHistoryRepository extends Repository<AuctionHistory> {}
