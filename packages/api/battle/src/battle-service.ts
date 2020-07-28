import {
  makeMobileRequest,
  makePostMobileRequest,
  nobotUtils,
  NOBOT_MOBILE_URL,
  regexUtils,
  Service
} from '@nobot-core/commons';
import { getLogger } from 'log4js';
import countryConfig from './country-config';
import { Country } from './types';

@Service()
export default class BattleService {
  private logger = getLogger(BattleService.name);

  test = async (): Promise<void> => {
    const login = 'zz0001';
    const friendships = await this.getFriendships(login);
    const targetCountry = this.getLowestFriendshipCountry(friendships, '');
    this.logger.info(targetCountry);
    this.goToCountry(login, targetCountry);
  };

  getFriendships = async (login: string): Promise<Map<string, number>> => {
    const friendships = new Map<string, number>();
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.PROFILE, login);
    const friendshipTable = page('#main').children().eq(16);
    const rows = friendshipTable.find('tr');
    for (let i = 1; i < rows.length; i++) {
      const row = rows.eq(i);
      const country = row.find('td').first().text();
      const level = regexUtils.catchByRegex(
        row.find('td').eq(1).find('img').attr('src'),
        /(?<=friendship_daimyo_)[0-9]/,
        'integer'
      ) as number;
      friendships.set(country, level);
    }
    return friendships;
  };

  getLowestFriendshipCountry = (friendships: Map<string, number>, exceptCountry: string): Country => {
    let levelRef = -1;
    let countryRef = '';
    friendships.forEach((level: number, country: string) => {
      if ((levelRef > level || levelRef === -1) && country !== exceptCountry) {
        levelRef = level;
        countryRef = country;
      }
    });
    return countryConfig.getCountryList().find((c) => c.name === countryRef) as Country;
  };

  goToCountry = async (login: string, targetCountry: Country): Promise<void> => {
    const page = await makeMobileRequest(NOBOT_MOBILE_URL.AREA_MAP, login);
    const areas = page('#mapbg area');
    const countryIds: number[] = [];
    for (let i = 0; i < areas.length; i++) {
      const area = areas.eq(i);
      countryIds.push(parseInt(area.attr('id') as string, 10));
    }
    const currentCountry = countryConfig.getCountryList().find((c) => !countryIds.includes(c.id));
    this.logger.info(currentCountry);
    if (currentCountry === targetCountry) {
      this.logger.info('Already at %s for %s', targetCountry.city, login);
      // TODO call
    } else {
      const movePage = await makePostMobileRequest(NOBOT_MOBILE_URL.MAP_MOVE, login, `id=${targetCountry.id}`);
      const seconds = nobotUtils.getSeconds(
        regexUtils.catchByRegex(movePage.html(), /[0-9]{2}:[0-9]{2}:[0-9]{2}/) as string
      );
      this.logger.info(seconds);
      const form = movePage('#sp_sc_5').parent();
      await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
      this.logger.info('Wait %d seconds to go to %s for %s', seconds, targetCountry.city, login);
      // TODO call next step
    }
  };
}
