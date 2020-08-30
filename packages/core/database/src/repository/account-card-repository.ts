import { EntityRepository, Repository } from 'typeorm';
import { AccountCard } from '../entities';

@EntityRepository(AccountCard)
export default class AccountCardRepository extends Repository<AccountCard> {
  findByLogin = (login: string): Promise<AccountCard[]> => {
    return this.find({ account: { login } });
  };
}
