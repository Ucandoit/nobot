import { EntityRepository, Repository } from 'typeorm';
import { Card } from '../entities';

@EntityRepository(Card)
export default class CardRepository extends Repository<Card> {
  findAll = (
    page = 0,
    size = 20,
    sort: keyof Card = 'number',
    order: 'ASC' | 'DESC' = 'ASC',
    query?: any
  ): Promise<[Card[], number]> => {
    return this.findAndCount({
      take: size,
      skip: page * size,
      order: {
        [sort]: order
      }
    });
  };
}
