import { EntityRepository, Repository } from 'typeorm';
import { Card } from '../entities';

@EntityRepository(Card)
export default class CardRepository extends Repository<Card> {
  findAll = (
    page = 0,
    size = 20,
    sort: keyof Card = 'number',
    order: 'ASC' | 'DESC' = 'ASC',
    filters?: Record<keyof Card, string>
  ): Promise<[Card[], number]> => {
    const query = this.createQueryBuilder('card')
      .take(size)
      .skip(page * size)
      .orderBy({
        [`card.${sort}`]: {
          order,
          nulls: order === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST'
        }
      })
      .where({
        display: true,
        ...filters
      });
    return query.getManyAndCount();
  };

  getCompleteCardIds = (): Promise<{ [key: string]: number }[]> => {
    const query = this.createQueryBuilder('card')
      .select('card.id', 'id')
      .orderBy('card.id', 'ASC')
      .where('card.number <> 9999 and card.cost <> 0');
    return query.getRawMany();
  };
}
