import { makeRequest, NOBOT_URL, redisClient, tokenManager } from '@nobot-core/commons';
import { Account } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { scheduleJob } from 'node-schedule';
import { getConnection } from 'typeorm';
import snipingTask from './sniping-task';

class AuctionService {
  private logger = getLogger(AuctionService.name);

  startSniping = async (login: string): Promise<void> => {
    if (login) {
      let token = await redisClient.get(`token-${login}`);
      if (!token) {
        this.logger.info('Token not found for %s', login);
        const account = await getConnection().getRepository<Account>('Account').findOne(login);
        if (account) {
          token = await tokenManager.updateToken(account);
        } else {
          throw new Error('Account not found.');
        }
      }
      const searchUrl = (await makeRequest(NOBOT_URL.TRADE_BUY, 'GET', token)) as string;
      const searchResultPage = (await makeRequest(searchUrl, 'GET', token)) as CheerioStatic;
      if (searchResultPage('#work-headers').length > 0) {
        const first = searchResultPage('#buy-list1');
        const buyForm = searchResultPage('#form');
        if (first.length > 0 && buyForm.length > 0) {
          const np = parseInt(searchResultPage('#lottery_point').text(), 10);
          const classNames = first.attr('class');
          const name = first.find('.trade-card-name u').text();
          this.logger.info('Np: %d, classnames: %s, name: %s', np, classNames, name);
        }
      }
    } else {
      throw new Error('Login not found.');
    }
  };

  start = async (): Promise<void> => {
    const job = scheduleJob('*/5 * * * * *', () => {
      const task = snipingTask.get('toto');
      if (task) {
        task.times += 1;
        this.logger.info('toto times: %d', task.times);
        if (task.times > 5) {
          this.logger.info('Exceeded.');
          task.job.cancel();
        }
      } else {
        throw new Error('toto');
      }
    });

    snipingTask.set('toto', job);
  };
}

export default new AuctionService();
