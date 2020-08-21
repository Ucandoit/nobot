import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import Account from './Account';

@Index('deck_config_pk', ['login'], { unique: true })
@Entity('deck_config', { schema: 'public' })
export default class DeckConfig {
  @Column('character varying', { primary: true, name: 'login', length: 32 })
  login: string;

  @Column('character varying', { name: 'favorite_card_ids', length: 255 })
  favoriteCardIds: string | null;

  @OneToOne(() => Account)
  @JoinColumn([{ name: 'login', referencedColumnName: 'login' }])
  account: Account;
}
