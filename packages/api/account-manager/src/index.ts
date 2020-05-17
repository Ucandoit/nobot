import { loadProjectConfig, redisClient } from '@nobot-core/commons';
import initConnection from '@nobot-core/database';
import { configure, getLogger } from 'log4js';
import startApp from './app';

configure({
  appenders: {
    out: { type: 'stdout' }
  },
  categories: { default: { appenders: ['out'], level: 'info' } },
  disableClustering: true
});

const logger = getLogger('account-manager-index');

const { redis, database } = loadProjectConfig('api_account_manager');

redisClient.start({
  ...redis,
  // eslint-disable-next-line @typescript-eslint/camelcase
  retry_strategy: (options) => {
    logger.info('Retrying.');
    if (options.attempt > 5) {
      throw new Error('Retry attempts reached.');
    }
    return 5000;
  }
});

initConnection(database).then(() => {
  logger.info('init postgres.');
  startApp();
});
