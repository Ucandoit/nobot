import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import AccountCard from './AccountCard';

@Index('sell_state_pkey', ['id'], { unique: true })
@Entity('sell_state', { schema: 'public' })
export default class SellState {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @OneToOne(() => AccountCard, { nullable: true })
  @JoinColumn([{ name: 'card_id', referencedColumnName: 'id' }])
  accountCard: AccountCard | null;

  @Column('character varying', { name: 'status', length: 32 })
  status: string;

  @Column('integer', { name: 'price' })
  price: number;

  @Column('timestamp with time zone', { name: 'post_date' })
  postDate: Date;

  @Column('timestamp with time zone', { name: 'sell_date', nullable: true })
  sellDate: Date;

  @Column('json', { name: 'archived_data', nullable: true })
  archivedData: object | null;
}
