import initConnection, { Account } from '@nobot-core/database';
import { configure, getLogger } from 'log4js';
import redis from 'redis';
import superagent from 'superagent';
import { Connection } from 'typeorm';

configure({
  appenders: {
    out: { type: 'stdout' }
  },
  categories: { default: { appenders: ['out'], level: 'info' } },
  disableClustering: true
});

const logger = getLogger('default');

const redisClient = redis.createClient({
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

const updateToken = async (account: Account): Promise<void> => {
  logger.info('Updating for %s.', account.login);
  const res = await superagent.get('http://yahoo-mbga.jp/game/12004455/play').set('Cookie', account.cookie);
  const html = res.text;
  const a = html.match(/<iframe id="ymbga_app" src="(.+?)".+<\/iframe>/);
  if (a && a.length > 0) {
    const b = a[1].match(/http:\/\/.+&st=(.+?)#rpctoken.+/);
    if (b && b.length > 0) {
      redisClient.set(`token-${account.login}`, decodeURIComponent(b[1]));
    }
  }
  logger.info('Updated for %s.', account.login);
};

const updateTokens = async (connection: Connection): Promise<void> => {
  const accounts = await connection.getRepository<Account>('Account').find();
  accounts.forEach((account) => {
    updateToken(account);
  });
};

// init postgres
initConnection().then((connection) => {
  updateTokens(connection);
  setInterval(() => updateTokens(connection), 30 * 60 * 1000);
});
