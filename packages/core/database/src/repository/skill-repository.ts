import { EntityRepository, Repository } from 'typeorm';
import { Skill } from '../entities';

@EntityRepository(Skill)
export default class SkillRepository extends Repository<Skill> {}
