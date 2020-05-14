import { Connection, createConnection } from 'typeorm';
import { Account, AccountCard, AuctionConfig, AuctionHistory, Card, Parameter, StoreCard } from './entities';

export interface PostgresConnectionOptions {
  host: string;
  port?: number;
  username: string;
  password: string;
  database: string;
  schema?: string;
  synchronize?: boolean;
  logging?: boolean;
}

const initConnection = async (options: PostgresConnectionOptions): Promise<Connection> => {
  return createConnection({
    type: 'postgres',
    port: 5432,
    schema: 'public',
    synchronize: true,
    entities: [Account, AuctionConfig, AuctionHistory, Card, Parameter, AccountCard, StoreCard],
    logging: false,
    ...options
  });
};

export * from './entities';
export default initConnection;
