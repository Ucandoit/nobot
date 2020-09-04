import { EntityRepository, Repository } from 'typeorm';
import { DrawHistory } from '../entities';

@EntityRepository(DrawHistory)
export default class DrawHistoryRepository extends Repository<DrawHistory> {}
