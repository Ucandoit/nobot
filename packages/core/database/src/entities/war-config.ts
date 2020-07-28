import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import Account from './Account';

interface WarStatus {
  warField?: string;
  warHost?: string;
}

@Index('war_config_pk', ['login'], { unique: true })
@Entity('war_config', { schema: 'public' })
export default class WarConfig {
  @Column('character varying', { primary: true, name: 'login', length: 32 })
  login: string;

  @Column('character varying', { name: 'group', length: 32 })
  group: string;

  @Column('integer', { name: 'line', default: () => '1' })
  line: number;

  @Column('boolean', { name: 'pc', default: () => 'false' })
  pc: boolean;

  @Column('boolean', { name: 'fp', default: () => 'false' })
  fp: boolean;

  @Column('boolean', { name: 'npc', default: () => 'true' })
  npc: boolean;

  @Column('boolean', { name: 'enable', default: () => 'true' })
  enable: boolean;

  @Column('json', { name: 'status', nullable: true })
  status: WarStatus | null;

  @OneToOne(() => Account)
  @JoinColumn([{ name: 'login', referencedColumnName: 'login' }])
  account: Account;
}
