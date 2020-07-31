import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
// eslint-disable-next-line import/no-cycle
import Account from './Account';

export type Status = 'BUILDING' | 'TRAINING' | 'FINISH';

@Index('account_config_pk', ['login'], { unique: true })
@Entity('account_config', { schema: 'public' })
export default class AccountConfig {
  @Column('character varying', { primary: true, name: 'login', length: 32 })
  login: string;

  @Column('character varying', { name: 'status', length: 32, default: () => `'BUILDING'` })
  status: Status;

  @Column('boolean', { name: 'daily_login', default: () => 'true' })
  dailyLogin: boolean;

  @Column('boolean', { name: 'battle_clear', default: () => 'false' })
  battleClear: boolean;

  @Column('boolean', { name: 'wrestle_clear', default: () => 'false' })
  wrestleClear: boolean;

  @Column('boolean', { name: 'refine_clear', default: () => 'false' })
  refineClear: boolean;

  @OneToOne(() => Account, (account) => account.accountConfig)
  @JoinColumn([{ name: 'login', referencedColumnName: 'login' }])
  account: Account;
}
