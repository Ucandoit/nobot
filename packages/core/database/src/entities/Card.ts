import { Column, Entity, Index } from 'typeorm';

@Index('card_pkey', ['id'], { unique: true })
@Entity('card', { schema: 'public' })
export default class Card {
  @Column('integer', { primary: true, name: 'id' })
  id: number;

  @Column('integer', { name: 'number' })
  number: number;

  @Column('character varying', { name: 'name', length: 255 })
  name: string;

  @Column('character varying', { name: 'real_name', length: 255 })
  realName: string;

  @Column('character varying', { name: 'rarity', length: 32 })
  rarity: string;

  @Column('character varying', { name: 'property', length: 32 })
  property: string;

  @Column('numeric', { name: 'cost', precision: 2, scale: 1 })
  cost: string;

  @Column('character varying', { name: 'military', length: 32 })
  military: string;

  @Column('character varying', { name: 'job', length: 32 })
  job: string;

  @Column('integer', { name: 'star', nullable: true, default: () => '0' })
  star: number | null;

  @Column('character varying', {
    name: 'face_url',
    nullable: true,
    length: 255
  })
  faceUrl: string | null;

  @Column('character varying', {
    name: 'illust_url',
    nullable: true,
    length: 255
  })
  illustUrl: string | null;

  @Column('integer', { name: 'initial_atk', nullable: true })
  initialAtk: number | null;

  @Column('integer', { name: 'initial_def', nullable: true })
  initialDef: number | null;

  @Column('integer', { name: 'initial_spd', nullable: true })
  initialSpd: number | null;

  @Column('integer', { name: 'initial_vir', nullable: true })
  initialVir: number | null;

  @Column('integer', { name: 'initial_stg', nullable: true })
  initialStg: number | null;

  @Column('integer', { name: 'final_atk', nullable: true })
  finalAtk: number | null;

  @Column('integer', { name: 'final_def', nullable: true })
  finalDef: number | null;

  @Column('integer', { name: 'final_spd', nullable: true })
  finalSpd: number | null;

  @Column('integer', { name: 'final_vir', nullable: true })
  finalVir: number | null;

  @Column('integer', { name: 'final_stg', nullable: true })
  finalStg: number | null;

  @Column('character varying', {
    name: 'personality',
    nullable: true,
    length: 255
  })
  personality: string | null;

  @Column('character varying', { name: 'slogan', nullable: true, length: 255 })
  slogan: string | null;

  @Column('text', { name: 'history', nullable: true })
  history: string | null;

  @Column('character varying', {
    name: 'train_skills',
    nullable: true,
    length: 255
  })
  trainSkills: string | null;
}
