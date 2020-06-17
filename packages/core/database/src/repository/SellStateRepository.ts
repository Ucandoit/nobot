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

  findAll = (
    page = 0,
    size = 20,
    sort = 'postDate',
    order: 'ASC' | 'DESC' = 'DESC',
    filters?: Partial<SellState>
  ): Promise<[SellState[], number]> => {
    const query = this.createQueryBuilder('sellState')
      .leftJoinAndSelect('sellState.accountCard', 'accountCard')
      .leftJoinAndSelect('accountCard.card', 'card')
      .take(size)
      .skip(page * size)
      .orderBy({
        [`sellState.${sort}`]: {
          order,
          nulls: order === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST'
        }
      })
      .where({
        ...filters
      });
    return query.getManyAndCount();
  };
}
