import { Column, Entity, Index, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import Account from './Account';
import Card from './Card';

@Index('account_card_pkey', ['id'], { unique: true })
@Entity('account_card', { schema: 'public' })
export default class AccountCard {
  @Column('integer', { primary: true, name: 'id' })
  id: number;

  @Column('integer', { name: 'deed' })
  deed: number;

  @Column('integer', { name: 'refine_current' })
  refineCurrent: number;

  @Column('integer', { name: 'refine_max' })
  refineMax: number;

  @Column('integer', { name: 'refine_lvl_atk' })
  refineLvlAtk: number;

  @Column('integer', { name: 'refine_lvl_def' })
  refineLvlDef: number;

  @Column('integer', { name: 'refine_lvl_spd' })
  refineLvlSpd: number;

  @Column('integer', { name: 'refine_lvl_vir' })
  refineLvlVir: number;

  @Column('integer', { name: 'refine_lvl_stg' })
  refineLvlStg: number;

  @Column('integer', { name: 'refine_atk' })
  refineAtk: number;

  @Column('integer', { name: 'refine_def' })
  refineDef: number;

  @Column('integer', { name: 'refine_spd' })
  refineSpd: number;

  @Column('integer', { name: 'refine_vir' })
  refineVir: number;

  @Column('integer', { name: 'refine_stg' })
  refineStg: number;

  @Column('boolean', { name: 'deck_card', default: () => 'false' })
  deckCard: boolean;

  @Column('boolean', { name: 'locked', default: () => 'false' })
  locked: boolean;

  @Column('boolean', { name: 'protected', default: () => 'false' })
  protect: boolean;

  @Column('boolean', { name: 'helper', default: () => 'false' })
  helper: boolean;

  @Column('boolean', { name: 'tradable', default: () => 'true' })
  tradable: boolean;

  @Column('boolean', { name: 'limit_break', default: () => 'false' })
  limitBreak: boolean;

  @ManyToOne(() => Account)
  @JoinColumn([{ name: 'login', referencedColumnName: 'login' }])
  account: Account;

  @ManyToOne(() => Card)
  @JoinColumn([{ name: 'card_id', referencedColumnName: 'id' }])
  card: Card;

  @RelationId((accountCard: AccountCard) => accountCard.card)
  cardId: number;

  @RelationId((accountCard: AccountCard) => accountCard.account)
  login: string;
}
