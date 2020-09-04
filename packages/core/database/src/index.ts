import { Connection, createConnection } from 'typeorm';
import {
  Account,
  AccountCard,
  AccountConfig,
  AuctionConfig,
  AuctionHistory,
  Card,
  DeckConfig,
  DrawHistory,
  Parameter,
  SellState,
  Skill,
  StoreCard,
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
      DrawHistory
    ],
    logging: false,
    ...options
  });
};

export * from './entities';
export * from './repository';
export default initConnection;
