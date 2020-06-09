import { Column, Entity, Index } from 'typeorm';

@Index('sell_state_pkey', ['card_id'], { unique: true })
@Entity('sell_state', { schema: 'public' })
export default class SellState {
  @Column('integer', { primary: true, name: 'card_id' })
  cardId: number;

  @Column('character varying', { name: 'card_name', length: 255 })
  cardName: string;

  @Column('character varying', { name: 'status', length: 32 })
  status: string;

  @Column('timestamp with time zone', { name: 'post_date' })
  postDate: Date;

  @Column('timestamp with time zone', { name: 'sell_date', nullable: true })
  sellDate: Date;
}
