import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import Account from './Account';

@Index('auction_config_pk', ['login'], { unique: true })
@Entity('auction_config', { schema: 'public' })
export default class AuctionConfig {
  @Column('character varying', { primary: true, name: 'login', length: 32 })
  login: string;

  @Column('boolean', { name: 'enabled', default: () => 'true' })
  enabled: boolean;

  @Column('integer', { name: 'start_hour', default: () => '0' })
  startHour: number;

  @Column('character varying', { name: 'comment', nullable: true, length: 255 })
  comment: string | null;

  @OneToOne(() => Account)
  @JoinColumn([{ name: 'login', referencedColumnName: 'login' }])
  account: Account;
}
