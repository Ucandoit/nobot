import { Column, Entity, Index, OneToOne } from 'typeorm';
// eslint-disable-next-line import/no-cycle
import AccountConfig from './AccountConfig';

@Index('account_pk', ['login'], { unique: true })
@Entity('account', { schema: 'public' })
export default class Account {
  @Column('character varying', { primary: true, name: 'login', length: 32 })
  login: string;

  @Column('character varying', { name: 'name', length: 32 })
  name: string;

  @Column('character varying', { name: 'cookie', length: 255 })
  cookie: string;

  @Column('timestamp with time zone', { name: 'expiration_date' })
  expirationDate: Date;

  @Column('integer', { name: 'np', default: () => '0' })
  np: number;

  @Column('character varying', {
    name: 'recruit_id',
    nullable: true,
    length: 255
  })
  recruitId: string | null;

  @Column('boolean', { name: 'mobile', default: () => 'false' })
  mobile: boolean;

  @OneToOne(() => AccountConfig, (accountConfig) => accountConfig.account)
  // @JoinColumn([{ name: 'login', referencedColumnName: 'login' }])
  accountConfig: AccountConfig | null;
}
