import { getFinalPage, NOBOT_MOBILE_URL, regexUtils, Service } from '@nobot-core/commons';
import { getLogger } from 'log4js';
import buildConfig from '../building/build-config';
import { Building, MapArea, ResourceCost, ResourceInfo } from '../types';

interface CardFace {
  id: number;
  faceUrl: string;
  action: boolean;
  trading: boolean;
}

interface VillageInfo {
  resourceInfo: ResourceInfo;
  areas: MapArea[];
  deckCards: CardFace[];
  reserveCards: CardFace[];
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
      deckCards: this.getCards(page, true),
      reserveCards: this.getCards(page, false)
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

  getCards = (page: CheerioStatic, inDeck: boolean): CardFace[] => {
    const cards: CardFace[] = [];
    const cardElements = page(inDeck ? '#pool_1 .reserve-face' : '#pool_2 .reserve-face, #pool_3 .reserve-face');
    for (let i = 0; i < cardElements.length; i++) {
      const cardElement = cardElements.eq(i);
      const id = regexUtils.catchByRegex(cardElement.attr('class'), /(?<=face-card-id)[0-9]+/) as number;
      const faceUrl = cardElement.children().first().attr('src') as string;
      let action = false;
      let trading = false;
      if (cardElement.attr('class')?.includes('action')) {
        const actionImgUrl = cardElement.children().eq(1).attr('src');
        if (actionImgUrl?.includes('action_01')) {
          action = true;
        } else if (actionImgUrl?.includes('action_02')) {
          trading = true;
        }
      }
      cards.push({
        id,
        faceUrl,
        action,
        trading
      });
    }
    return cards;
  };

  costEnough = (resourceCost: ResourceCost, resourceInfo: ResourceInfo): boolean => {
    return (
      resourceCost.fire <= resourceInfo.fire &&
      resourceCost.earth <= resourceInfo.earth &&
      resourceCost.wind <= resourceInfo.wind &&
      resourceCost.water <= resourceInfo.water &&
      resourceCost.sky <= resourceInfo.sky
    );
  };
}
