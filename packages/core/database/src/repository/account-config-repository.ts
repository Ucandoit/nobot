import { EntityRepository, Repository } from 'typeorm';
import { AccountConfig } from '../entities';

@EntityRepository(AccountConfig)
export default class AccountConfigRepository extends Repository<AccountConfig> {
  findAll = (
    page = 0,
    size = 20,
    sort = 'login',
    order: 'ASC' | 'DESC' = 'ASC',
    filters?: Partial<AccountConfig>
  ): Promise<[AccountConfig[], number]> => {
    const query = this.createQueryBuilder('accountConfig')
      .take(size)
      .skip(page * size)
      .orderBy({
        [`accountConfig.${sort}`]: {
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
