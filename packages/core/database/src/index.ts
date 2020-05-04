import { Connection, createConnection } from 'typeorm';
import Account from './entities/Account';

export const initConnection = async (): Promise<Connection> => {
  console.log('init postgres 3');
  return createConnection({
    type: 'postgres',
    host: 'nobot-database',
    port: 5432,
    username: 'nobot',
    password: 'nobot',
    database: 'nobot',
    schema: 'public',
    synchronize: true,
    entities: [Account],
    logging: true
  });
};

export default initConnection;
export { Account };
