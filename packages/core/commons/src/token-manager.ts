import { Account } from '@nobot-core/database';
import { getLogger } from 'log4js';
import superagent from 'superagent';
import { getConnection, MoreThan } from 'typeorm';
import redisClient from './redis-client';

class TokenManager {
  logger = getLogger(TokenManager.name);

  updateToken = async (account: Account): Promise<void> => {
    this.logger.info('Updating for %s.', account.login);
    const res = await superagent.get('http://yahoo-mbga.jp/game/12004455/play').set('Cookie', account.cookie);
    const html = res.text;
    const a = html.match(/<iframe id="ymbga_app" src="(.+?)".+<\/iframe>/);
    if (a && a.length > 0) {
      const b = a[1].match(/http:\/\/.+&st=(.+?)#rpctoken.+/);
      if (b && b.length > 0) {
        redisClient.set(`token-${account.login}`, decodeURIComponent(b[1]));
      }
    }
    this.logger.info('Updated for %s.', account.login);
  };

  updateTokens = async (): Promise<void> => {
    const accounts = await getConnection()
      .getRepository<Account>('Account')
      .find({
        expirationDate: MoreThan(new Date())
      });
    accounts.forEach((account) => {
      this.updateToken(account);
    });
  };
}

export default new TokenManager();
