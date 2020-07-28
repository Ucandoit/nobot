import { Column, Entity, Index } from 'typeorm';

@Index('skill_pkey', ['id'], { unique: true })
@Entity('skill', { schema: 'public' })
export default class Skill {
  @Column('integer', { primary: true, name: 'id' })
  id: number;

  @Column('character varying', { name: 'name', length: 32 })
  name: string;

  @Column('character varying', { name: 'property', length: 32 })
  property: string;

  @Column('character varying', { name: 'type', length: 32 })
  type: string;

  @Column('integer', { name: 'level' })
  level: number;

  @Column('integer', { name: 'weight' })
  weight: number;

  @Column('character varying', { name: 'target', length: 32, nullable: true })
  target: string | null;

  @Column('character varying', { name: 'effect', length: 1024 })
  effect: string;

  @Column('character varying', { name: 'condition', length: 32, nullable: true })
  condition: string | null;
}
