import { makeRequest, NOBOT_URL, redisClient, tokenManager } from '@nobot-core/commons';
import { getLogger } from 'log4js';
import { Job, scheduleJob } from 'node-schedule';
import { AuctionCard } from './auction-card';
import auctionConfigService from './auction-config-service';

class AuctionService {
  private logger = getLogger(AuctionService.name);

  private jobs = new Map<string, Job>();

  dailyReset = async (): Promise<void> => {
    this.logger.info('Daily reset start.');
    this.stopAll();
    this.logger.info('Clear sniping count for all start.');
    const auctionConfigs = await auctionConfigService.getAuctionConfigs();
    await auctionConfigs.forEach(async (auctionConfig) => {
      await redisClient.del(`sniping-count-${auctionConfig.login}`);
    });
    this.logger.info('Clear sniping count for all finish.');
    this.startAll();
    this.logger.info('Daily reset finish.');
  };

  startAll = async (): Promise<void> => {
    this.logger.info('Start all auction sniping.');
    const auctionConfigs = await auctionConfigService.getAuctionConfigs();
    const now = new Date();
    const offset = -9;
    auctionConfigs.forEach(async (auctionConfig) => {
      const startTime = this.calculateStartTime(auctionConfig.startHour, now, offset);
      const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
      this.startSniping(auctionConfig.login, startTime, endTime);
    });
  };

  stopAll = (): void => {
    this.logger.info('Stop all auction sniping.');
    this.jobs.forEach((job) => {
      job.cancel();
    });
    this.jobs = new Map<string, Job>();
  };

  startSniping = async (login: string, start?: Date, end?: Date): Promise<void> => {
    if (login) {
      const token = await tokenManager.getToken(login);
      const searchUrl = (await makeRequest(NOBOT_URL.TRADE_BUY, 'GET', token)) as string;
      if (searchUrl) {
        const rule = '*/5 * * * * *';
        const jobOptions = start && end ? { start, end, rule } : rule;
        this.logger.info('Start job for %s, start time: %s, end time: %s', login, start, end);
        const job = scheduleJob(jobOptions, this.createJob(login, searchUrl));
        this.jobs.set(login, job);
      }
    } else {
      throw new Error('Login not found.');
    }
  };

  stopSniping = (login: string): void => {
    this.logger.info('Stop auction sniping for %s.', login);
    const job = this.jobs.get(login);
    if (job) {
      job.cancel();
    }
  };

  createJob = (login: string, searchUrl: string) => {
    return async (): Promise<void> => {
      const job = this.jobs.get(login);
      if (job) {
        // get count from redis
        const countString = await redisClient.get(`sniping-count-${login}`);
        const count = countString ? parseInt(countString, 10) : 1;
        if (count > 15) {
          this.logger.info('Max times reached for %s', login);
          job.cancel();
          return;
        }
        this.logger.info('Start sniping %d for %s', count, login);
        // request ah page
        const token = await tokenManager.getToken(login);
        const searchResultPage = (await makeRequest(searchUrl, 'GET', token)) as CheerioStatic;
        if (searchResultPage('#work-headers').length > 0) {
          const auctionCard = this.readFromPage(searchResultPage);
          if (auctionCard) {
            // TODO
          } else {
            this.logger.info('Nothing found for %s.', login);
          }
        } else {
          this.logger.warn('Abadonned for %s', login);
        }
        await redisClient.set(`sniping-count-${login}`, (count + 1).toString());
      } else {
        throw new Error(`Unable to start sniping job for ${login}.`);
      }
    };
  };

  readFromPage = (page: CheerioStatic): AuctionCard | null => {
    const first = page('#buy-list1');
    const buyForm = page('#form');
    if (first.length > 0 && buyForm.length > 0) {
      let tradeBuyId = '';
      let cardBuyId = '';
      const classNames = first.attr('class')?.split(' ');
      this.logger.info(classNames);
      if (classNames && classNames.length > 0) {
        classNames.forEach((className) => {
          if (className.startsWith('trade-buy-id')) {
            tradeBuyId = className.replace('trade-buy-id', '');
          } else if (className.startsWith('card-buy-id')) {
            cardBuyId = className.replace('card-buy-id', '');
          }
        });
      }
      const rarityImg = first.find('.rank_image_new').attr('src');
      const name = first.find('.trade-card-name u').text();
      const illust = first.find('.card-face-icon').attr('src');
      const price = parseInt(first.find('.point').text(), 10);
      const np = parseInt(page('#lottery_point').text(), 10);
      const requestParams = this.replaceTradeBuyId(buyForm.serialize(), tradeBuyId);
      return {
        tradeBuyId,
        cardBuyId,
        rarity: this.getRarity(rarityImg),
        star: this.getStar(rarityImg),
        name,
        illust,
        price,
        currentNP: np,
        requestParams
      };
    }
    return null;
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

  getRarity = (rarityImg: string | undefined): string => {
    let rarityCode = '';
    if (rarityImg) {
      const rarityCodeMatch = rarityImg.match(/(?<=rare_0)[0-9](?=_)/);
      if (rarityCodeMatch) {
        [rarityCode] = rarityCodeMatch;
      }
    }
    switch (rarityCode) {
      case '1':
        return '並';
      case '2':
        return '珍';
      case '3':
        return '稀';
      case '4':
        return '極';
      case '5':
        return '宝';
      case '6':
        return '誉';
      case '7':
        return '煌';
      default:
        return 'Unknown';
    }
  };

  getStar = (rarityImg: string | undefined): number => {
    let star = 0;
    if (rarityImg) {
      const starMatch = rarityImg.match(/(?<=star0)[0-9](?=_)/);
      if (starMatch) {
        star = parseInt(starMatch[0], 10);
      }
    }
    return star;
  };

  replaceTradeBuyId = (formData: string, tradeBuyId: string): string => {
    return formData.replace(/(?<=&trade-id=)[0-9]+(?=&)/, tradeBuyId);
  };
}

export default new AuctionService();
