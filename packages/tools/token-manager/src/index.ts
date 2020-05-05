import { redisClient, tokenManager } from '@nobot-core/commons';
import initConnection from '@nobot-core/database';
import { configure } from 'log4js';

configure({
  appenders: {
    out: { type: 'stdout' }
  },
  categories: { default: { appenders: ['out'], level: 'info' } },
  disableClustering: true
});

redisClient.start();

// init postgres
initConnection().then(() => {
  tokenManager.updateTokens();
  setInterval(() => tokenManager.updateTokens(), 30 * 60 * 1000);
});

export { redisClient, tokenManager };
