import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Account from './Account';

@Index('auction_history_pkey', ['id'], { unique: true })
@Entity('auction_history', { schema: 'public' })
export default class AuctionHistory {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('character varying', { name: 'card_rarity', length: 32 })
  cardRarity: string;

  @Column('character varying', { name: 'card_name', length: 255 })
  cardName: string;

  @Column('character varying', { name: 'card_illust', length: 255, nullable: true })
  cardIllust: string | null;

  @Column('integer', { name: 'card_price' })
  cardPrice: number;

  @Column('timestamp with time zone', { name: 'snipe_time' })
  snipeTime: Date;

  @ManyToOne(() => Account)
  @JoinColumn([{ name: 'login', referencedColumnName: 'login' }])
  login: Account;
}
