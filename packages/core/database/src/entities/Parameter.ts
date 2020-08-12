import { Column, Entity, Index } from 'typeorm';

@Index('parameter_pk', ['code'], { unique: true })
@Entity('parameter', { schema: 'public' })
export default class Parameter {
  @Column('character varying', { primary: true, name: 'code', length: 32 })
  code: string;

  @Column('character varying', { name: 'value', length: 1024 })
  value: string;
}
