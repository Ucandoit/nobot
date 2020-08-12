import { EntityRepository, Repository } from 'typeorm';
import { Parameter } from '../entities';

@EntityRepository(Parameter)
export default class ParameterRepository extends Repository<Parameter> {}
