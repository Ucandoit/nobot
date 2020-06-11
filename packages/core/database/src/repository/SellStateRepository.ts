import { EntityRepository, Repository } from 'typeorm';
import { SellState } from '../entities';

@EntityRepository(SellState)
export default class SellStateRepository extends Repository<SellState> {
  public getAll = (): Promise<SellState[]> => {
    return this.find({
      order: {
        postDate: 'DESC'
      }
    });
  };

  public getSellingCards = (): Promise<SellState[]> => {
    return this.find({
      relations: ['accountCard', 'accountCard.card', 'accountCard.account'],
      where: {
        status: 'SELLING'
      }
    });
  };
}
