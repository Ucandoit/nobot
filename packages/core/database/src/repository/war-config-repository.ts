import { EntityRepository, Repository } from 'typeorm';
import { WarConfig } from '../entities';

@EntityRepository(WarConfig)
export default class WarConfigRepository extends Repository<WarConfig> {
  findAll = (
    page = 0,
    size = 20,
    sort = 'login',
    order: 'ASC' | 'DESC' = 'ASC',
    filters?: Partial<WarConfig>
  ): Promise<[WarConfig[], number]> => {
    const query = this.createQueryBuilder('warConfig')
      .take(size)
      .skip(page * size)
      .orderBy({
        [`warConfig.${sort}`]: {
          order,
          nulls: order === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST'
        }
      })
      .where({
        ...filters
      });
    return query.getManyAndCount();
  };

  findByGroup = (group: string): Promise<WarConfig[]> => {
    return this.find({
      where: {
        group
      },
      order: {
        login: 'ASC'
      }
    });
  };

  findEnabled = (): Promise<WarConfig[]> => {
    return this.find({
      where: {
        enable: true
      },
      order: {
        login: 'ASC'
      }
    });
  };
}
