import { Account } from '@nobot-core/database';
import { inject, injectable } from 'inversify';
import { Connection, Repository } from 'typeorm';
import Titi from './titi';

@injectable()
export default class Toto {
  // repo: Repository<Account>;
  @inject(Titi)
  titi: Titi;

  connection: Connection;

  repo: Repository<Account>;

  constructor(connection: Connection) {
    console.log('toto construct');
    this.connection = connection;
    this.repo = connection.getRepository<Account>('Account');
  }

  find = (): Promise<Account | undefined> => {
    return this.repo.findOne('ucandoit');
  };
}
