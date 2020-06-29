import { getLogger } from 'log4js';
import { Building, ResourceCost } from '../types';

class BuildConfig {
  private logger = getLogger(BuildConfig.name);

  private buildCostMap: Map<string, Map<number, ResourceCost>>;

  private buildingList: Building[];

  constructor() {
    this.constructBuildCostMap();
    this.constructBuildingList();
  }

  getBuildCostMap = (): Map<string, Map<number, ResourceCost>> => this.buildCostMap;

  getBuildingList = (): Building[] => this.buildingList;

  private constructBuildCostMap = (): void => {
    this.logger.info('Initializing build cost map.');
    this.buildCostMap = new Map<string, Map<number, ResourceCost>>();
    this.buildCostMap.set('storage', this.getStorageBuildCostMap());
    this.buildCostMap.set('food', this.getFoodBuildCostMap());
    this.buildCostMap.set('paddy', this.getPaddyBuildCostMap());
    this.buildCostMap.set('market', this.getMarketBuildCostMap());
    this.buildCostMap.set('home_basic', this.getHomeBasicBuildCostMap());
    this.buildCostMap.set('fire', this.getFireBuildCostMap());
    this.buildCostMap.set('earth', this.getEarthBuildCostMap());
    this.buildCostMap.set('wind', this.getWindBuildCostMap());
    this.buildCostMap.set('water', this.getWaterBuildCostMap());
    this.buildCostMap.set('sky', this.getSkyBuildCostMap());
  };

  private getStorageBuildCostMap = (): Map<number, ResourceCost> => {
    const map = new Map<number, ResourceCost>();
    map.set(0, { fire: 8, earth: 0, wind: 0, water: 4, sky: 1, seconds: 24, reducedSeconds: 24 / 6 });
    map.set(1, { fire: 18, earth: 0, wind: 0, water: 10, sky: 3, seconds: 144, reducedSeconds: 144 / 6 });
    map.set(2, { fire: 40, earth: 0, wind: 0, water: 24, sky: 8, seconds: 24 * 60, reducedSeconds: 24 * 10 });
    map.set(3, { fire: 76, earth: 0, wind: 0, water: 45, sky: 15, seconds: 54 * 60, reducedSeconds: 54 * 10 });
    map.set(4, { fire: 130, earth: 0, wind: 0, water: 78, sky: 26, seconds: 108 * 60, reducedSeconds: 108 * 10 });
    map.set(5, { fire: 206, earth: 0, wind: 0, water: 123, sky: 41, seconds: 180 * 60, reducedSeconds: 180 * 10 });
    map.set(6, { fire: 308, earth: 0, wind: 0, water: 184, sky: 61, seconds: 270 * 60, reducedSeconds: 270 * 10 });
    map.set(7, { fire: 442, earth: 0, wind: 0, water: 265, sky: 88, seconds: 360 * 60, reducedSeconds: 360 * 10 });
    map.set(8, { fire: 616, earth: 0, wind: 0, water: 369, sky: 123, seconds: 450 * 60, reducedSeconds: 450 * 10 });
    return map;
  };

  private getFoodBuildCostMap = (): Map<number, ResourceCost> => {
    const map = new Map<number, ResourceCost>();
    map.set(0, { fire: 0, earth: 8, wind: 4, water: 0, sky: 1, seconds: 24, reducedSeconds: 24 / 6 });
    map.set(1, { fire: 0, earth: 18, wind: 10, water: 0, sky: 3, seconds: 144, reducedSeconds: 144 / 6 });
    map.set(2, { fire: 0, earth: 40, wind: 24, water: 0, sky: 8, seconds: 24 * 60, reducedSeconds: 24 * 10 });
    map.set(3, { fire: 0, earth: 76, wind: 45, water: 0, sky: 15, seconds: 54 * 60, reducedSeconds: 54 * 10 });
    map.set(4, { fire: 0, earth: 130, wind: 78, water: 0, sky: 26, seconds: 108 * 60, reducedSeconds: 108 * 10 });
    map.set(5, { fire: 0, earth: 206, wind: 123, water: 0, sky: 41, seconds: 180 * 60, reducedSeconds: 180 * 10 });
    map.set(6, { fire: 0, earth: 308, wind: 184, water: 0, sky: 61, seconds: 270 * 60, reducedSeconds: 270 * 10 });
    map.set(7, { fire: 0, earth: 442, wind: 265, water: 0, sky: 88, seconds: 360 * 60, reducedSeconds: 360 * 10 });
    map.set(8, { fire: 0, earth: 616, wind: 369, water: 0, sky: 123, seconds: 450 * 60, reducedSeconds: 450 * 10 });
    return map;
  };

  private getPaddyBuildCostMap = (): Map<number, ResourceCost> => {
    const map = new Map<number, ResourceCost>();
    map.set(0, { fire: 0, earth: 8, wind: 0, water: 9, sky: 6, seconds: 30, reducedSeconds: 30 / 10 });
    map.set(1, { fire: 0, earth: 18, wind: 0, water: 20, sky: 13, seconds: 180, reducedSeconds: 180 / 10 });
    map.set(2, { fire: 0, earth: 37, wind: 0, water: 43, sky: 27, seconds: 14 * 60, reducedSeconds: 14 * 10 });
    map.set(3, { fire: 0, earth: 70, wind: 0, water: 80, sky: 50, seconds: 48 * 60, reducedSeconds: 48 * 10 });
    map.set(4, { fire: 0, earth: 119, wind: 0, water: 136, sky: 85, seconds: 108 * 60, reducedSeconds: 108 * 10 });
    map.set(5, { fire: 0, earth: 187, wind: 0, water: 214, sky: 133, seconds: 171 * 60, reducedSeconds: 171 * 10 });
    map.set(6, { fire: 0, earth: 278, wind: 0, water: 318, sky: 199, seconds: 342 * 60, reducedSeconds: 342 * 10 });
    map.set(7, { fire: 0, earth: 395, wind: 0, water: 452, sky: 282, seconds: 570 * 60, reducedSeconds: 570 * 10 });
    map.set(8, { fire: 0, earth: 542, wind: 0, water: 620, sky: 387, seconds: 798 * 60, reducedSeconds: 798 * 10 });
    return map;
  };

  private getMarketBuildCostMap = (): Map<number, ResourceCost> => {
    const map = new Map<number, ResourceCost>();
    map.set(0, { fire: 59, earth: 54, wind: 48, water: 42, sky: 36, seconds: 18 * 60, reducedSeconds: 18 * 10 });
    map.set(1, { fire: 54, earth: 89, wind: 80, water: 71, sky: 62, seconds: 72 * 60, reducedSeconds: 72 * 10 });
    map.set(2, { fire: 93, earth: 80, wind: 133, water: 120, sky: 107, seconds: 144 * 60, reducedSeconds: 144 * 10 });
    map.set(3, { fire: 160, earth: 140, wind: 120, water: 200, sky: 180, seconds: 242 * 60, reducedSeconds: 242 * 10 });
    map.set(4, { fire: 309, earth: 229, wind: 290, water: 180, sky: 299, seconds: 374 * 60, reducedSeconds: 374 * 10 });
    map.set(5, { fire: 449, earth: 464, wind: 389, water: 314, sky: 299, seconds: 548 * 60, reducedSeconds: 548 * 10 });
    map.set(6, { fire: 404, earth: 693, wind: 605, water: 558, sky: 471, seconds: 772 * 60, reducedSeconds: 772 * 10 });
    map.set(7, {
      fire: 706,
      earth: 655,
      wind: 1129,
      water: 908,
      sky: 807,
      seconds: 1054 * 60,
      reducedSeconds: 1054 * 10
    });
    map.set(8, {
      fire: 1210,
      earth: 1059,
      wind: 908,
      water: 1513,
      sky: 1361,
      seconds: 1402 * 60,
      reducedSeconds: 1402 * 10
    });
    return map;
  };

  private getHomeBasicBuildCostMap = (): Map<number, ResourceCost> => {
    const map = new Map<number, ResourceCost>();
    map.set(0, { fire: 0, earth: 0, wind: 0, water: 0, sky: 0, seconds: 5, reducedSeconds: 5 / 6 });
    map.set(1, { fire: 4, earth: 4, wind: 4, water: 4, sky: 4, seconds: 5, reducedSeconds: 5 / 6 });
    map.set(2, { fire: 12, earth: 12, wind: 12, water: 12, sky: 12, seconds: 60, reducedSeconds: 60 / 6 });
    map.set(3, { fire: 22, earth: 22, wind: 22, water: 22, sky: 22, seconds: 4 * 60, reducedSeconds: 4 * 10 });
    map.set(4, { fire: 37, earth: 37, wind: 37, water: 37, sky: 37, seconds: 16 * 60, reducedSeconds: 16 * 10 });
    map.set(5, { fire: 60, earth: 60, wind: 60, water: 60, sky: 60, seconds: 48 * 60, reducedSeconds: 48 * 10 });
    map.set(6, { fire: 94, earth: 94, wind: 94, water: 94, sky: 94, seconds: 144 * 60, reducedSeconds: 144 * 10 });
    map.set(7, { fire: 142, earth: 142, wind: 142, water: 142, sky: 142, seconds: 288 * 60, reducedSeconds: 288 * 10 });
    map.set(8, { fire: 207, earth: 207, wind: 207, water: 207, sky: 207, seconds: 504 * 60, reducedSeconds: 504 * 10 });
    return map;
  };

  private getFireBuildCostMap = (): Map<number, ResourceCost> => {
    const map = new Map<number, ResourceCost>();
    map.set(0, { fire: 14, earth: 6, wind: 0, water: 0, sky: 0, seconds: 30, reducedSeconds: 30 / 6 });
    map.set(1, { fire: 46, earth: 19, wind: 0, water: 0, sky: 0, seconds: 180, reducedSeconds: 180 / 6 });
    map.set(2, { fire: 110, earth: 44, wind: 0, water: 0, sky: 0, seconds: 12 * 60, reducedSeconds: 12 * 10 });
    map.set(3, { fire: 206, earth: 83, wind: 0, water: 0, sky: 0, seconds: 48 * 60, reducedSeconds: 48 * 10 });
    map.set(4, { fire: 366, earth: 147, wind: 92, water: 0, sky: 0, seconds: 138 * 60, reducedSeconds: 138 * 10 });
    map.set(5, { fire: 590, earth: 236, wind: 148, water: 0, sky: 0, seconds: 298 * 60, reducedSeconds: 298 * 10 });
    map.set(6, { fire: 878, earth: 352, wind: 220, water: 0, sky: 0, seconds: 546 * 60, reducedSeconds: 546 * 10 });
    map.set(7, { fire: 1294, earth: 518, wind: 324, water: 0, sky: 0, seconds: 902 * 60, reducedSeconds: 902 * 10 });
    map.set(8, { fire: 1838, earth: 736, wind: 460, water: 0, sky: 0, seconds: 1388 * 60, reducedSeconds: 1388 * 10 });
    return map;
  };

  private getEarthBuildCostMap = (): Map<number, ResourceCost> => {
    const map = new Map<number, ResourceCost>();
    map.set(0, { fire: 0, earth: 14, wind: 0, water: 0, sky: 6, seconds: 30, reducedSeconds: 30 / 6 });
    map.set(1, { fire: 0, earth: 46, wind: 0, water: 0, sky: 19, seconds: 180, reducedSeconds: 180 / 6 });
    map.set(2, { fire: 0, earth: 110, wind: 0, water: 0, sky: 44, seconds: 12 * 60, reducedSeconds: 12 * 10 });
    map.set(3, { fire: 0, earth: 206, wind: 0, water: 0, sky: 83, seconds: 48 * 60, reducedSeconds: 48 * 10 });
    map.set(4, { fire: 92, earth: 366, wind: 0, water: 0, sky: 147, seconds: 138 * 60, reducedSeconds: 138 * 10 });
    map.set(5, { fire: 148, earth: 590, wind: 0, water: 0, sky: 236, seconds: 298 * 60, reducedSeconds: 298 * 10 });
    map.set(6, { fire: 220, earth: 878, wind: 0, water: 0, sky: 352, seconds: 546 * 60, reducedSeconds: 546 * 10 });
    map.set(7, { fire: 324, earth: 1294, wind: 0, water: 0, sky: 518, seconds: 902 * 60, reducedSeconds: 902 * 10 });
    map.set(8, { fire: 460, earth: 1838, wind: 0, water: 0, sky: 736, seconds: 1388 * 60, reducedSeconds: 1388 * 10 });
    return map;
  };

  private getWindBuildCostMap = (): Map<number, ResourceCost> => {
    const map = new Map<number, ResourceCost>();
    map.set(0, { fire: 6, earth: 0, wind: 14, water: 0, sky: 0, seconds: 30, reducedSeconds: 30 / 6 });
    map.set(1, { fire: 19, earth: 0, wind: 46, water: 0, sky: 0, seconds: 180, reducedSeconds: 180 / 6 });
    map.set(2, { fire: 44, earth: 0, wind: 110, water: 0, sky: 0, seconds: 12 * 60, reducedSeconds: 12 * 10 });
    map.set(3, { fire: 83, earth: 0, wind: 206, water: 0, sky: 0, seconds: 48 * 60, reducedSeconds: 48 * 10 });
    map.set(4, { fire: 147, earth: 0, wind: 366, water: 92, sky: 0, seconds: 138 * 60, reducedSeconds: 138 * 10 });
    map.set(5, { fire: 236, earth: 0, wind: 590, water: 148, sky: 0, seconds: 298 * 60, reducedSeconds: 298 * 10 });
    map.set(6, { fire: 352, earth: 0, wind: 878, water: 220, sky: 0, seconds: 546 * 60, reducedSeconds: 546 * 10 });
    map.set(7, { fire: 518, earth: 0, wind: 1294, water: 324, sky: 0, seconds: 902 * 60, reducedSeconds: 902 * 10 });
    map.set(8, { fire: 736, earth: 0, wind: 1838, water: 460, sky: 0, seconds: 1388 * 60, reducedSeconds: 1388 * 10 });
    return map;
  };

  private getWaterBuildCostMap = (): Map<number, ResourceCost> => {
    const map = new Map<number, ResourceCost>();
    map.set(0, { fire: 0, earth: 0, wind: 6, water: 14, sky: 0, seconds: 30, reducedSeconds: 30 / 6 });
    map.set(1, { fire: 0, earth: 0, wind: 19, water: 46, sky: 0, seconds: 180, reducedSeconds: 180 / 6 });
    map.set(2, { fire: 0, earth: 0, wind: 44, water: 110, sky: 0, seconds: 12 * 60, reducedSeconds: 12 * 10 });
    map.set(3, { fire: 0, earth: 0, wind: 83, water: 206, sky: 0, seconds: 48 * 60, reducedSeconds: 48 * 10 });
    map.set(4, { fire: 0, earth: 0, wind: 147, water: 366, sky: 92, seconds: 138 * 60, reducedSeconds: 138 * 10 });
    map.set(5, { fire: 0, earth: 0, wind: 236, water: 590, sky: 148, seconds: 298 * 60, reducedSeconds: 298 * 10 });
    map.set(6, { fire: 0, earth: 0, wind: 352, water: 878, sky: 220, seconds: 546 * 60, reducedSeconds: 546 * 10 });
    map.set(7, { fire: 0, earth: 0, wind: 518, water: 1294, sky: 324, seconds: 902 * 60, reducedSeconds: 902 * 10 });
    map.set(8, { fire: 0, earth: 0, wind: 736, water: 1838, sky: 460, seconds: 1388 * 60, reducedSeconds: 1388 * 10 });
    return map;
  };

  private getSkyBuildCostMap = (): Map<number, ResourceCost> => {
    const map = new Map<number, ResourceCost>();
    map.set(0, { fire: 0, earth: 0, wind: 0, water: 6, sky: 14, seconds: 30, reducedSeconds: 30 / 6 });
    map.set(1, { fire: 0, earth: 0, wind: 0, water: 19, sky: 46, seconds: 180, reducedSeconds: 180 / 6 });
    map.set(2, { fire: 0, earth: 0, wind: 0, water: 44, sky: 110, seconds: 12 * 60, reducedSeconds: 12 * 10 });
    map.set(3, { fire: 0, earth: 0, wind: 0, water: 83, sky: 206, seconds: 48 * 60, reducedSeconds: 48 * 10 });
    map.set(4, { fire: 0, earth: 92, wind: 0, water: 147, sky: 366, seconds: 138 * 60, reducedSeconds: 138 * 10 });
    map.set(5, { fire: 0, earth: 148, wind: 0, water: 236, sky: 590, seconds: 298 * 60, reducedSeconds: 298 * 10 });
    map.set(6, { fire: 0, earth: 220, wind: 0, water: 352, sky: 878, seconds: 546 * 60, reducedSeconds: 546 * 10 });
    map.set(7, { fire: 0, earth: 324, wind: 0, water: 518, sky: 1294, seconds: 902 * 60, reducedSeconds: 902 * 10 });
    map.set(8, { fire: 0, earth: 460, wind: 0, water: 736, sky: 1838, seconds: 1388 * 60, reducedSeconds: 1388 * 10 });
    return map;
  };

  private constructBuildingList = (): void => {
    this.buildingList = [];
    this.buildingList.push({ type: 'type02', title: '宝物庫', facility: 'storage' });
    this.buildingList.push({ type: 'type16', title: '兵糧庫', facility: 'food' });
    this.buildingList.push({ type: 'type17', title: '水田', facility: 'paddy' });
    this.buildingList.push({ type: 'type03', title: '修練場【火】', facility: 'fire' });
    this.buildingList.push({ type: 'type04', title: '修練場【地】', facility: 'earth' });
    this.buildingList.push({ type: 'type05', title: '修練場【風】', facility: 'wind' });
    this.buildingList.push({ type: 'type06', title: '修練場【水】', facility: 'water' });
    this.buildingList.push({ type: 'type07', title: '修練場【空】', facility: 'sky' });
    this.buildingList.push({ type: 'type09', title: '奥義開発所', facility: 'dev_basic' });
    this.buildingList.push({ type: 'type13', title: '楽市楽座', facility: 'market' });
    this.buildingList.push({ type: 'type01', title: '館', facility: 'home_basic' });
    this.buildingList.push({ type: 'type00', title: '空き地', facility: 'free' });
  };
}

export default new BuildConfig();
