import { Connection, createConnection } from 'typeorm';
import {
  Account,
  AccountCard,
  AccountConfig,
  AuctionConfig,
  AuctionHistory,
  Card,
  DeckConfig,
  Parameter,
  SellState,
  Skill,
  StoreCard,
  Task,
  WarConfig
} from './entities';

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
    entities: [
      Account,
      AuctionConfig,
      AuctionHistory,
      Card,
      Parameter,
      AccountCard,
      StoreCard,
      SellState,
      AccountConfig,
      WarConfig,
      Skill,
      DeckConfig,
      Task
    ],
    logging: false,
    ...options
  });
};

export * from './entities';
export * from './repository';
export * from './types';
export default initConnection;
