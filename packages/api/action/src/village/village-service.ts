import { getFinalPage, NOBOT_MOBILE_URL, regexUtils, Service } from '@nobot-core/commons';
import { AccountCard, DeckConfigRepository } from '@nobot-core/database';
import axios from 'axios';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm';
import buildConfig from '../building/build-config';
import { Building, MapArea, ResourceCost, ResourceInfo } from '../types';

interface CardFace {
  id: number;
  faceUrl: string;
  action: boolean;
  trading: boolean;
  inDeck: boolean;
}

interface CardDetail extends CardFace {
  favorite: boolean;
  accountCard?: AccountCard;
}

interface VillageInfo {
  resourceInfo: ResourceInfo;
  areas: MapArea[];
  // deckCards: CardFace[];
  // reserveCards: CardFace[];
  cards: CardFace[];
}

@Service()
export default class VillageService {
  private logger = getLogger(VillageService.name);

  private deckConfigRepository: DeckConfigRepository;

  constructor(connection: Connection) {
    this.deckConfigRepository = connection.getCustomRepository(DeckConfigRepository);
  }

  getVillage = async (login: string): Promise<VillageInfo> => {
    this.logger.info('get village info of %s', login);
    const page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);

    return {
      resourceInfo: this.getResourceInfo(page),
      areas: this.getMapInfo(page),
      // deckCards: await this.getCards(page, true, login, accountCards),
      // reserveCards: await this.getCards(page, false, login, accountCards),
      cards: await this.getCards(page, login)
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

  getCards = async (page: CheerioStatic, login: string): Promise<CardDetail[]> => {
    const cards: CardDetail[] = [];
    // get account cards
    const res = await axios.get(`http://card:3000/cards/account?login=${login}`);
    const accountCards = res.data as AccountCard[];
    // get favorite cards
    const deckConfig = await this.deckConfigRepository.findOne(login);
    const favoriteCardIds = deckConfig?.favoriteCardIds?.split(',') ?? [];

    const deckCards = page('#pool_1 .reserve-face');
    deckCards.each((i) => {
      const card = deckCards.eq(i);
      const cardFace = this.mapToCardFace(card, true);
      cards.push({
        ...cardFace,
        favorite: favoriteCardIds.includes(cardFace.id.toString()),
        accountCard: accountCards.find((c) => c.id === cardFace.id)
      });
    });

    const reserveCards = page('#pool_2 .reserve-face, #pool_3 .reserve-face');
    reserveCards.each((i) => {
      const card = reserveCards.eq(i);
      const cardFace = this.mapToCardFace(card, true);
      cards.push({
        ...cardFace,
        favorite: favoriteCardIds.includes(cardFace.id.toString()),
        accountCard: accountCards.find((c) => c.id === cardFace.id)
      });
    });

    // TODO: add account card that does not exist any more
    return cards;
  };

  private mapToCardFace = (card: Cheerio, inDeck: boolean): CardFace => {
    const id = regexUtils.catchByRegexAsNumber(card.attr('class'), /(?<=face-card-id)[0-9]+/);
    if (id) {
      const faceUrl = card.children().first().attr('src') as string;
      let action = false;
      let trading = false;
      if (card.attr('class')?.includes('action')) {
        const actionImgUrl = card.children().eq(1).attr('src');
        if (actionImgUrl?.includes('action_01')) {
          action = true;
        } else if (actionImgUrl?.includes('action_02')) {
          trading = true;
        }
      }
      return {
        id,
        faceUrl,
        action,
        trading,
        inDeck
      };
    }
    throw new Error('Unable to get card id.');
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
