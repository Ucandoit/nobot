import { makeRequest, NOBOT_URL, tokenManager } from '@nobot-core/commons';
import { AuctionConfig } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { scheduleJob } from 'node-schedule';
import { getConnection, SelectQueryBuilder } from 'typeorm';
import snipingTask from './sniping-task';

class AuctionService {
  private logger = getLogger(AuctionService.name);

  startAll = async (): Promise<void> => {
    const auctionConfigs = await getConnection()
      .getRepository<AuctionConfig>('AuctionConfig')
      .find({
        join: {
          alias: 'auctionConfig',
          leftJoin: {
            account: 'auctionConfig.account'
          }
        },
        where: (qb: SelectQueryBuilder<AuctionConfig>) => {
          qb.where('auctionConfig.enabled = :enabled', {
            enabled: true
          }).andWhere('account.expirationDate >= :date', {
            date: new Date()
          });
        }
      });
    const now = new Date();
    const offset = -9;
    auctionConfigs.forEach(async (auctionConfig) => {
      const startTime = this.calculateStartTime(auctionConfig.startHour, now, offset);
      const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
      this.startSniping(auctionConfig.login, startTime, endTime);
    });
  };

  startSniping = async (login: string, start?: Date, end?: Date): Promise<void> => {
    if (login) {
      const token = await tokenManager.getToken(login);
      const searchUrl = (await makeRequest(NOBOT_URL.TRADE_BUY, 'GET', token)) as string;
      if (searchUrl) {
        const rule = '*/5 * * * * *';
        const jobOptions = start && end ? { start, end, rule } : rule;
        const job = scheduleJob(jobOptions, this.createJob(login, searchUrl));
        snipingTask.set(login, job);
      }
    } else {
      throw new Error('Login not found.');
    }
  };

  createJob = (login: string, searchUrl: string) => {
    return async (): Promise<void> => {
      const task = snipingTask.get(login);
      if (task) {
        this.logger.info('Start sniping for %s', login);
        const token = await tokenManager.getToken(login);
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
        throw new Error('Unable to start sniping task.');
      }
    };
  };

  calculateStartTime = (startHour: number, now: Date, offset: number): Date => {
    let hour = startHour + offset;
    if (hour < 0) {
      hour += 24;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
    }
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    return new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), hour, 0, 0);
  };
}

export default new AuctionService();
