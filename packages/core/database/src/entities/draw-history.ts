import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Account from './Account';

@Index('draw_history_pkey', ['id'], { unique: true })
@Entity('draw_history', { schema: 'public' })
export default class DrawHistory {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('character varying', { name: 'card_rarity', length: 32 })
  cardRarity: string;

  @Column('character varying', { name: 'card_name', length: 255 })
  cardName: string;

  @Column('integer', { name: 'card_star', default: () => '0' })
  cardStar: number;

  @Column('timestamp with time zone', { name: 'draw_time' })
  drawTime: Date;

  @ManyToOne(() => Account)
  @JoinColumn([{ name: 'login', referencedColumnName: 'login' }])
  account: Account;
}
