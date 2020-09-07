import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TaskStatus, TaskType } from '../types';
import Account from './Account';

@Index('task_pk', ['id'], { unique: true })
@Entity('task', { schema: 'public' })
export default class Task<T> {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('character varying', { name: 'type', length: 32 })
  type: TaskType;

  @Column('character varying', { name: 'status', length: 32 })
  status: TaskStatus;

  @Column('timestamp with time zone', { name: 'start_time' })
  startTime: Date;

  @Column('timestamp with time zone', { name: 'end_time', nullable: true })
  endTime: Date | null;

  @Column('json')
  properties: T;

  @ManyToOne(() => Account)
  @JoinColumn([{ name: 'login', referencedColumnName: 'login' }])
  account: Account;
}
