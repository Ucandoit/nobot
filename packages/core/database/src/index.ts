import { Connection, createConnection } from 'typeorm';
import { Account, AuctionConfig, AuctionHistory, Card, Parameter } from './entities';

const initConnection = async (): Promise<Connection> => {
  return createConnection({
    type: 'postgres',
    host: 'nobot-database',
    port: 5432,
    username: 'nobot',
    password: 'nobot',
    database: 'nobot',
    schema: 'public',
    synchronize: true,
    entities: [Account, AuctionConfig, AuctionHistory, Card, Parameter],
    logging: false
  });
};

export * from './entities';
export default initConnection;
