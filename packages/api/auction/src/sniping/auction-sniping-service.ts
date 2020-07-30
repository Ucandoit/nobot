import { makeMobileRequest, NOBOT_MOBILE_URL, redisClient, regexUtils, Service } from '@nobot-core/commons';
import { AuctionConfigRepository, AuctionHistory, AuctionHistoryRepository } from '@nobot-core/database';
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

  startAll = async (): Promise<void> => {
    this.logger.info('Start all auction sniping.');
    const auctionConfigs = await this.auctionConfigRepository.getEnabledAuctionConfigs();
    const now = new Date();
    const offset = -9;
    auctionConfigs.forEach(async (auctionConfig) => {
      const startTime = this.calculateStartTime(auctionConfig.startHour, now, offset);
      const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
      this.startSniping(auctionConfig.login, startTime, endTime);
    });
  };

  startSniping = (login: string, start?: Date, end?: Date): void => {
    const rule = '*/20 * * * * *';
    const jobOptions = start && end ? { start, end, rule } : rule;
    this.logger.info('Start job for %s, start time: %s, end time: %s', login, start, end);
    const job = scheduleJob(jobOptions, this.createJob(login));
    this.jobs.set(login, job);
  };

  createJob = (login: string) => {
    return async (): Promise<void> => {
      const job = this.jobs.get(login);
      if (job) {
        // get count from redis
        const countString = await redisClient.get(`sniping-count-${login}`);
        const count = countString ? parseInt(countString, 10) : 1;
        if (count > 1999) {
          this.logger.info('Max times reached for %s.', login);
          job.cancel();
          return;
        }
        this.logger.info('Start sniping %d for %s', count, login);
        const page = await makeMobileRequest(NOBOT_MOBILE_URL.TRADE_BUY, login);
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
              // save in history
              await this.auctionHistoryRepository.save({
                ...auctionCard,
                snipeTime: new Date(),
                account: { login }
              });
            } else {
              this.logger.info('Not enough money for %s.', login);
              // TODO can be saved for consulting
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
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
    }
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    return new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), hour, 0, 0);
  };
}
