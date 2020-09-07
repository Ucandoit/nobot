import {
  getFinalPage,
  makePostMobileRequest,
  nobotUtils,
  NOBOT_MOBILE_URL,
  regexUtils,
  Service
} from '@nobot-core/commons';
import he from 'he';
import { getLogger } from 'log4js';

@Service()
export default class MapService {
  private logger = getLogger(MapService.name);

  checkInAction = async (login: string, page?: CheerioStatic): Promise<boolean> => {
    this.logger.info('Checking is in action for %s.', login);
    const villagePage = page || (await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login));
    let action = false;
    const deckCards = villagePage('#pool_1 div[class^=face-card-id]');
    if (deckCards.length > 0) {
      deckCards.each((i, card) => {
        if (card.attribs.class.includes('action')) {
          action = true;
        }
      });
    }
    return action;
  };

  goToCountry = async (login: string, countryId: number): Promise<number> => {
    try {
      this.logger.info('Go to %d for %s.', countryId, login);
      const isInAction = await this.checkInAction(login);
      if (isInAction) {
        this.logger.warn('Impossible to move beacause deck cards are in action for %s.', login);
        return -1;
      }
      const movePage = await makePostMobileRequest(NOBOT_MOBILE_URL.MAP_MOVE, login, `id=${countryId}`);
      const secondsText = regexUtils.catchByRegex(movePage.html(), /[0-9]{2}:[0-9]{2}:[0-9]{2}/) as string | null;
      if (secondsText) {
        const seconds = nobotUtils.getSeconds(secondsText);
        const form = movePage('#sp_sc_5').parent();
        await makePostMobileRequest(form.attr('action') as string, login, form.serialize(), false);
        this.logger.info('Need %d seconds to go to the country for %s.', seconds, login);
        return seconds;
      }
      if (movePage.html().includes(he.encode('実行できません'))) {
        this.logger.info('Already at the country for %s.', login);
        return 0;
      }
      return -1;
    } catch (err) {
      this.logger.error(err);
      return -1;
    }
  };

  convertFood = async (login: string, page?: CheerioStatic): Promise<number> => {
    const villagePage = page || (await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login));
    const fire = parseInt(villagePage('#element_fire').text(), 10);
    const earth = parseInt(villagePage('#element_earth').text(), 10);
    const wind = parseInt(villagePage('#element_wind').text(), 10);
    const water = parseInt(villagePage('#element_water').text(), 10);
    const sky = parseInt(villagePage('#element_sky').text(), 10);
    let food = parseInt(villagePage('#element_food').text(), 10);
    if (Number.isNaN(food)) {
      this.logger.info(he.decode(villagePage.html()));
      throw new Error(`Food is NaN for ${login}`);
    }
    if (fire >= 3000 || earth >= 3000 || wind >= 3000 || water >= 3000 || sky >= 3000) {
      const convertedFood =
        Math.floor(fire / 20) +
        Math.floor(earth / 20) +
        Math.floor(wind / 20) +
        Math.floor(water / 20) +
        Math.floor(sky / 20);
      if (convertedFood > 0 && convertedFood + food <= 7500) {
        this.logger.info('Convert food: %d', convertedFood);
        const buildIdx = this.getMarketBuildIdx(villagePage);
        if (buildIdx > 0) {
          await makePostMobileRequest(NOBOT_MOBILE_URL.TRADE, login, `useall=1&buildIdx=${buildIdx}`);
          food += convertedFood;
        } else {
          this.logger.warn('No market found for %s.', login);
        }
      } else {
        this.logger.warn('Food exceeded for %s.', login);
      }
    }
    return food;
  };

  // TODO: set market build index in database
  getMarketBuildIdx = (page: CheerioStatic): number => {
    let buildIdx = 0;
    const areas = page('#mapbg area');
    for (let i = 0; i < areas.length; i++) {
      const area = areas.eq(i);
      const classes = area.attr('class') as string;
      if (classes.includes('type13')) {
        buildIdx = regexUtils.catchByRegexAsNumber(classes, /(?<=map)[0-9]{2}/) || -1;
        break;
      }
    }
    return buildIdx;
  };
}
