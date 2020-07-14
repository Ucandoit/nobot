import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
// eslint-disable-next-line import/no-cycle
import Account from './Account';

@Index('account_config_pk', ['login'], { unique: true })
@Entity('account_config', { schema: 'public' })
export default class AccountConfig {
  @Column('character varying', { primary: true, name: 'login', length: 32 })
  login: string;

  @Column('boolean', { name: 'building', default: () => 'true' })
  building: boolean;

  @Column('boolean', { name: 'training', default: () => 'true' })
  training: boolean;

  @Column('boolean', { name: 'daily_login', default: () => 'true' })
  dailyLogin: boolean;

  @OneToOne(() => Account, (account) => account.accountConfig)
  @JoinColumn([{ name: 'login', referencedColumnName: 'login' }])
  account: Account;
}
