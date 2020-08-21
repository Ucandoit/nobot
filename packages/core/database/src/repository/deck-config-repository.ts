import { EntityRepository, Repository } from 'typeorm';
import { DeckConfig } from '../entities';

@EntityRepository(DeckConfig)
export default class DeckConfigRepository extends Repository<DeckConfig> {}
