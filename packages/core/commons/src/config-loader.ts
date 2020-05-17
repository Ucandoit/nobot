import fs from 'fs';
import { load, loadAll, Schema, Type } from 'js-yaml';
import { getLogger } from 'log4js';

interface PostgresConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema?: string;
  synchronize?: boolean;
  logging?: boolean;
}

interface RedisConfig {
  host: string;
  port: number;
}

interface NobotConfig {
  database: PostgresConfig;
  redis: RedisConfig;
}

const logger = getLogger('config-loader');
const configFolder = '../../../config';

const loadProjectConfig = (projectName: string): NobotConfig => {
  logger.info(process.env.CONFIG_PROFILE);
  const configProfile = process.env.CONFIG_PROFILE ?? 'DEV';
  logger.info('Load config with profile %s', configProfile);
  const config = load(fs.readFileSync(`${configFolder}/config-${configProfile.toLowerCase()}.yml`, 'utf-8'));
  const configType = new Type('!config', {
    kind: 'scalar',
    construct: (data): object => {
      return config[data] ?? {};
    },
    instanceOf: Object
  });
  const documents = loadAll(fs.readFileSync(`${configFolder}/application.yml`, 'utf-8'), null, {
    schema: Schema.create([configType])
  });
  const projectConfig = documents.find((document) => document.projectName === projectName);
  return projectConfig || {};
};

export default loadProjectConfig;
