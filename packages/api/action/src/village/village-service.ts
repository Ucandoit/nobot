import { getFinalPage, NOBOT_MOBILE_URL, regexUtils, Service } from '@nobot-core/commons';
import { getLogger } from 'log4js';
import buildConfig from '../building/build-config';
import { Building, MapArea, ResourceInfo } from '../types';

interface CardFace {
  id: number;
  faceUrl: string;
}

interface VillageInfo {
  resourceInfo: ResourceInfo;
  areas: MapArea[];
  deckCards: CardFace[];
}

@Service()
export default class VillageService {
  private logger = getLogger(VillageService.name);

  getVillage = async (login: string): Promise<VillageInfo> => {
    this.logger.info('get village info of %s', login);
    const page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
    return {
      resourceInfo: this.getResourceInfo(page),
      areas: this.getMapInfo(page),
      deckCards: this.getDeckCards(page)
    };
  };

  getMapInfo = (page: CheerioStatic): MapArea[] => {
    const areas: MapArea[] = [];
    const buildings = page('#mapbg area');
    for (let i = 0; i < buildings.length; i++) {
      const building = buildings.eq(i);
      const [mapId, type, billing] = (building.attr('class') as string).split(' ');
      if (mapId.includes('map') && !billing) {
        const [title, levelStr] = (building.attr('title') as string).split(' ');
        const level = levelStr ? parseInt(levelStr.replace('Lv.', ''), 10) : 0;
        areas.push({
          mapId,
          building: buildConfig.getBuildingList().find((b) => b.type === type) as Building,
          title,
          level,
          constructing: page(`#buildingimg .${mapId}.constructing`).length > 0,
          running: page(`#buildingimg .${mapId}.running`).length > 0
        });
      }
    }
    return areas;
  };

  getResourceInfo = (page: CheerioStatic): ResourceInfo => {
    return {
      fire: parseInt(page('#element_fire').text(), 10),
      maxFire: parseInt(page('#max_fire').text(), 10),
      earth: parseInt(page('#element_earth').text(), 10),
      maxEarth: parseInt(page('#max_earth').text(), 10),
      wind: parseInt(page('#element_wind').text(), 10),
      maxWind: parseInt(page('#max_wind').text(), 10),
      water: parseInt(page('#element_water').text(), 10),
      maxWater: parseInt(page('#max_water').text(), 10),
      sky: parseInt(page('#element_sky').text(), 10),
      maxSky: parseInt(page('#max_sky').text(), 10),
      food: parseInt(page('#element_food').text(), 10),
      maxFood: parseInt(page('#max_food').text(), 10),
      np: parseInt(page('span#lottery_point').text(), 10)
    };
  };

  getDeckCards = (page: CheerioStatic): CardFace[] => {
    const deckCards: CardFace[] = [];
    const cards = page('#pool_1 .reserve-face');
    for (let i = 0; i < cards.length; i++) {
      const card = cards.eq(i);
      deckCards.push({
        id: regexUtils.catchByRegex(card.attr('class'), /(?<=face-card-id)[0-9]+/) as number,
        faceUrl: card.children().first().attr('src') as string
      });
    }
    return deckCards;
  };
}
