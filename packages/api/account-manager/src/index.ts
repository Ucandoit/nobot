import { redisClient } from '@nobot-core/commons';
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

redisClient.start({
  host: 'nobot-redis',
  port: 6379,
  // eslint-disable-next-line @typescript-eslint/camelcase
  retry_strategy: (options) => {
    logger.info('Retrying.');
    if (options.attempt > 5) {
      throw new Error('Retry attempts reached.');
    }
    return 5000;
  }
});

initConnection({
  host: '51.68.190.225',
  // host: 'vps-aba0a878.vps.ovh.ca',
  // host: 'nobot-database',
  // port: 5433,
  port: 5432,
  username: 'nobunyaganoyabo',
  // username: 'nobot',
  password: 'nobunyaganoyabo',
  // password: 'nobot',
  database: 'nobunyaganoyabo',
  // database: 'nobot',
  schema: 'public',
  synchronize: false,
  logging: true
}).then(() => {
  logger.info('init postgres.');
  startApp();
});
