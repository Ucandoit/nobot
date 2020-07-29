import { makeMobileRequest, NOBOT_MOBILE_URL, regexUtils, Service } from '@nobot-core/commons';
import { getLogger } from 'log4js';

@Service()
export default class AuctionSnipingService {
  private logger = getLogger(AuctionSnipingService.name);

  startSniping = async (login: string): Promise<void> => {
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.TRADE_BUY, login);
    const cardMessages = page('span[id^=message-buy]');
    const cardDiv = cardMessages.eq(0).prev().children().eq(0);
    const npDiv = cardMessages.eq(0).prev().children().eq(1);
    const leftTable = cardDiv.find('table table');
    const rarityUrl = decodeURIComponent(leftTable.find('tr img').first().attr('src') as string);
    const rightDiv = cardDiv.find('> table > tbody > tr > td').eq(1).children().first();
    const skills = rightDiv.find('div[id^=skill-name]');
    const np = regexUtils.catchByRegex(npDiv.children().eq(0).text(), /(?<=.+)[0-9]+/, 'integer') as number;
    const card = {
      name: cardDiv.find('div > font').eq(1).text(),
      rarity: this.getRarity(rarityUrl),
      star: this.getStar(rarityUrl),
      illust: leftTable.find('img[class^=face-card-id]').attr('src'),
      np,
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
    this.logger.info(card);
  };

  getRarity = (img: string | undefined): string => {
    const rarityCode = regexUtils.catchByRegex(img, /(?<=rare_0)[0-9](?=_)/);
    this.logger.info(rarityCode);
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

  getStar = (img: string | undefined): number => {
    const starCode = regexUtils.catchByRegex(img, /(?<=star0)[0-9](?=_)/, 'integer') as number | null;
    return starCode || 0;
  };

  getSkills = (skillElements: Cheerio): string[] => {
    const skills: string[] = [];
    for (let i = 0; i < skillElements.length; i++) {
      const skillElement = skillElements.eq(i);
      skills.push(`${skillElement.find('div').eq(1).text()} ${skillElement.find('div').eq(0).text()}`);
    }
    return skills;
  };
}
