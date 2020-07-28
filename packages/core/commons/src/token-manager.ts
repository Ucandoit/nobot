import { Account } from '@nobot-core/database';
import axios from 'axios';
import { getLogger } from 'log4js';
import superagent from 'superagent';
import { getConnection, MoreThan } from 'typeorm';
import redisClient from './redis-client';

class TokenManager {
  private logger = getLogger(TokenManager.name);

  private mobileHeaders = {
    Host: 'sp.pf.mbga.jp',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': 1,
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6,zh;q=0.5',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
  };

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
    if (account.mobile) {
      return this.updateMobileTokens(account);
    }
    const res = await superagent.get('http://yahoo-mbga.jp/game/12004455/play').set('Cookie', account.cookie);
    const html = res.text;
    const a = html.match(/<iframe id="ymbga_app" src="(.+?)".+<\/iframe>/);
    if (a && a.length > 0) {
      const b = a[1].match(/http:\/\/.+&st=(.+?)#rpctoken.+/);
      if (b && b.length > 0) {
        const token = decodeURIComponent(b[1]);
        await redisClient.set(`token-${account.login}`, token, 30 * 60);
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

  updateMobileTokens = async (account: Account): Promise<string> => {
    try {
      let res = await axios.get('http://sp.pf.mbga.jp/12004455', {
        headers: this.mobileHeaders,
        maxRedirects: 0,
        validateStatus: (status) => {
          return status === 302;
        }
      });
      res = await axios.get(res.headers.location, {
        headers: {
          ...this.mobileHeaders,
          Cookie: account.cookie
        },
        validateStatus: (status) => {
          return status === 302;
        }
      });
      res = await axios.get(res.request.res.responseUrl, {
        headers: {
          ...this.mobileHeaders,
          Cookie: 'x-mbga-check-cookie=1;'
        },
        maxRedirects: 0,
        validateStatus: (status) => {
          return status === 302;
        }
      });
      const [token] = res.headers['set-cookie'].find((c: string) => c.includes('sp_mbga_sid_12004455')).split(';');
      await redisClient.set(`token-${account.login}`, token, 30 * 60);
      this.logger.info('Updated for %s.', account.login);
      return token;
    } catch (err) {
      this.logger.error(err);
      throw new Error('Error while updating mobile token.');
    }
  };
}

export default new TokenManager();
