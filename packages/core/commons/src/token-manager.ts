import { Account } from '@nobot-core/database';
import { getLogger } from 'log4js';
import superagent from 'superagent';
import { getConnection, MoreThan } from 'typeorm';
import redisClient from './redis-client';

class TokenManager {
  logger = getLogger(TokenManager.name);

  getToken = async (login: string): Promise<string> => {
    let token = await redisClient.get(`token-${login}`);
    if (!token) {
      this.logger.info('Token-%s not found in cache.', login);
      const account = await getConnection().getRepository<Account>('Account').findOne(login);
      if (account) {
        token = await this.updateToken(account);
      } else {
        throw new Error('Account not found.');
      }
    }
    return token;
  };

  updateToken = async (account: Account): Promise<string> => {
    this.logger.info('Updating for %s.', account.login);
    const res = await superagent.get('http://yahoo-mbga.jp/game/12004455/play').set('Cookie', account.cookie);
    const html = res.text;
    const a = html.match(/<iframe id="ymbga_app" src="(.+?)".+<\/iframe>/);
    if (a && a.length > 0) {
      const b = a[1].match(/http:\/\/.+&st=(.+?)#rpctoken.+/);
      if (b && b.length > 0) {
        const token = decodeURIComponent(b[1]);
        await redisClient.set(`token-${account.login}`, token);
        this.logger.info('Updated for %s.', account.login);
        return token;
      }
    }
    throw new Error('Error while updating token.');
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
