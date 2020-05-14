import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import Account from './Account';
import Card from './Card';

@Index('store_card_pkey', ['login', 'id'], { unique: true })
@Entity('store_card', { schema: 'public' })
export default class StoreCard {
  @Column('character varying', { primary: true, name: 'login', length: 32 })
  login: string;

  @Column('integer', { primary: true, name: 'card_id' })
  id: number;

  @Column('integer', { name: 'count' })
  count: number;

  @ManyToOne(() => Account)
  @JoinColumn([{ name: 'login', referencedColumnName: 'login' }])
  account: Account;

  @ManyToOne(() => Card)
  @JoinColumn([{ name: 'card_id', referencedColumnName: 'id' }])
  card: Card;
}
