import {
  makeMobileRequest,
  makePostMobileRequest,
  NOBOT_MOBILE_URL,
  redisClient,
  regexUtils,
  Service
} from '@nobot-core/commons';
import { AuctionConfigRepository, AuctionHistory, AuctionHistoryRepository } from '@nobot-core/database';
import he from 'he';
import { getLogger } from 'log4js';
import { Job, scheduleJob } from 'node-schedule';
import { Connection } from 'typeorm';

@Service()
export default class AuctionSnipingService {
  private logger = getLogger(AuctionSnipingService.name);

  private jobs = new Map<string, Job>();

  private auctionHistoryRepository: AuctionHistoryRepository;

  private auctionConfigRepository: AuctionConfigRepository;

  constructor(connection: Connection) {
    this.auctionHistoryRepository = connection.getCustomRepository(AuctionHistoryRepository);
    this.auctionConfigRepository = connection.getCustomRepository(AuctionConfigRepository);
  }

  dailyReset = async (): Promise<void> => {
    this.logger.info('Daily reset start.');
    this.stopAll();
    this.logger.info('Clear sniping count for all start.');
    const auctionConfigs = await this.auctionConfigRepository.getAll();
    await auctionConfigs.forEach(async (auctionConfig) => {
      await redisClient.del(`sniping-count-${auctionConfig.login}`);
    });
    this.logger.info('Clear sniping count for all finish.');
    this.startAll();
    this.logger.info('Daily reset finish.');
  };

  startAll = async (): Promise<void> => {
    this.logger.info('Start all auction sniping.');
    const auctionConfigs = await this.auctionConfigRepository.getEnabledAuctionConfigs();
    const now = new Date();
    let offset = -9;
    if (process.env.HOUR_OFFSET) {
      offset += parseInt(process.env.HOUR_OFFSET, 10);
    }
    auctionConfigs.forEach((auctionConfig) => {
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

  startSniping = (login: string, start?: Date, end?: Date): void => {
    const rule = '*/5 * * * * *';
    const jobOptions = start && end ? { start, end, rule } : rule;
    this.logger.info('Start job for %s, start time: %s, end time: %s', login, start, end);
    const job = scheduleJob(jobOptions, this.createJob(login));
    this.jobs.set(login, job);
  };

  stopSniping = (login: string): void => {
    this.logger.info('Stop auction sniping for %s.', login);
    const job = this.jobs.get(login);
    if (job) {
      job.cancel();
    }
  };

  createJob = (login: string) => {
    return async (): Promise<void> => {
      const job = this.jobs.get(login);
      if (job) {
        // get count from redis
        const countString = await redisClient.get(`sniping-count-${login}`);
        const count = countString ? parseInt(countString, 10) : 1;
        if (count > 3950) {
          this.logger.info('Max times reached for %s.', login);
          job.cancel();
          return;
        }
        this.logger.info('Start sniping %d for %s', count, login);
        const page = await makeMobileRequest(NOBOT_MOBILE_URL.TRADE_BUY, login);
        if (page('#main > center').first().html()?.includes(he.encode('頻度が高す'))) {
          this.logger.warn('Abadonned for %s', login);
          job.cancel();
          return;
        }
        const cardMessages = page('span[id^=message-buy]');
        if (cardMessages.length > 0) {
          const auctionCard = this.htmlToCard(cardMessages.first(), login);
          if (auctionCard) {
            this.logger.info('Card %s found for %s.', auctionCard.cardName, login);
            const currentNp = regexUtils.catchByRegex(
              page('#main > div').eq(3).text(),
              /(?<=.+)[0-9]+/,
              'integer'
            ) as number;
            if (currentNp >= (auctionCard.cardPrice as number)) {
              this.logger.info('Trying to buy for %s.', login);
              // request buy card
              const tradeId = regexUtils.catchByRegex(
                cardMessages.first().attr('id'),
                /(?<=.+)[0-9]+/,
                'integer'
              ) as number;
              await makePostMobileRequest(NOBOT_MOBILE_URL.TRADE_BUY, login, `trade_id=${tradeId}&select=yes&catev=0`);
              // save in history
              await this.auctionHistoryRepository.save({
                ...auctionCard,
                snipeTime: new Date(),
                account: { login }
              });
            } else {
              this.logger.info('Not enough money for %s.', login);
            }
          } else {
            this.logger.info('Nothing found for %s.', login);
          }
        } else {
          this.logger.info('Nothing found for %s.', login);
        }
        await redisClient.set(`sniping-count-${login}`, (count + 1).toString());
      } else {
        throw new Error(`Unable to start sniping job for ${login}.`);
      }
    };
  };

  resetTimes = async (login: string): Promise<void> => {
    await redisClient.del(`sniping-count-${login}`);
  };

  private htmlToCard = (element: Cheerio, login: string): Partial<AuctionHistory | null> => {
    try {
      const cardDiv = element.prev().children().eq(0);
      const npDiv = element.prev().children().eq(1);
      const leftTable = cardDiv.find('table table');
      const rarityUrl = decodeURIComponent(leftTable.find('tr img').first().attr('src') as string);
      const rightDiv = cardDiv.find('> table > tbody > tr > td').eq(1).children().first();
      const skills = rightDiv.find('div[id^=skill-name]');
      const np = regexUtils.catchByRegex(npDiv.children().eq(0).text(), /(?<=.+)[0-9]+/, 'integer') as number;
      return {
        cardName: cardDiv.find('div > font').eq(1).text(),
        cardRarity: this.getRarity(rarityUrl),
        cardStar: this.getStar(rarityUrl),
        cardIllust: leftTable.find('img[class^=face-card-id]').attr('src'),
        cardPrice: np,
        detail: {
          deed: regexUtils.catchByRegex(rightDiv.find('> div').eq(0).text(), /(?<=.+)[0-9]+/, 'integer'),
          refineLvl: rightDiv.find('> div').eq(3).text(),
          refineLvlAtk: rightDiv.find('> div').eq(4).find('div').first().text(),
          refineLvlDef: rightDiv.find('> div').eq(5).find('div').first().text(),
          refineLvlSpd: rightDiv.find('> div').eq(6).find('div').first().text(),
          refineLvlVir: rightDiv.find('> div').eq(7).find('div').first().text(),
          refineLvlStg: rightDiv.find('> div').eq(8).find('div').first().text(),
          skills: this.getSkills(skills)
        }
      };
    } catch (err) {
      this.logger.error('Error while converting sniping card for %s.', login);
      return null;
    }
  };

  private getRarity = (img: string | undefined): string => {
    const rarityCode = regexUtils.catchByRegex(img, /(?<=rare_0)[0-9](?=_)/);
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
        return '並';
    }
  };

  private getStar = (img: string | undefined): number => {
    const starCode = regexUtils.catchByRegex(img, /(?<=star0)[0-9](?=_)/, 'integer') as number | null;
    return starCode || 0;
  };

  private getSkills = (skillElements: Cheerio): string[] => {
    const skills: string[] = [];
    for (let i = 0; i < skillElements.length; i++) {
      const skillElement = skillElements.eq(i);
      skills.push(`${skillElement.find('div').eq(1).text()} ${skillElement.find('div').eq(0).text()}`);
    }
    return skills;
  };

  private calculateStartTime = (startHour: number, now: Date, offset: number): Date => {
    let hour = startHour + offset;
    if (hour < 0) {
      hour += 24;
    }
    if (hour >= 15) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
    }
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    return new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), hour, 0, 0);
  };
}
