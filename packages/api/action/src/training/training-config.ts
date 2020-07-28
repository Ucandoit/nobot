import { getLogger } from 'log4js';
import { ResourceCost, Training } from '../types';

class TrainingConfig {
  private logger = getLogger(TrainingConfig.name);

  private trainingCostMap: Map<string, Map<number, ResourceCost>>;

  constructor() {
    this.constructTrainingCostMap();
  }

  private constructTrainingCostMap = (): void => {
    this.logger.info('Initialising Training cost map.');
    this.trainingCostMap = new Map<string, Map<number, ResourceCost>>();
    this.trainingCostMap.set('fire', this.getTrainCostMap('fire'));
    this.trainingCostMap.set('earth', this.getTrainCostMap('earth'));
    this.trainingCostMap.set('wind', this.getTrainCostMap('wind'));
    this.trainingCostMap.set('water', this.getTrainCostMap('water'));
    this.trainingCostMap.set('sky', this.getTrainCostMap('sky'));
  };

  private getTrainCostMap = (training: Training): Map<number, ResourceCost> => {
    const map = new Map<number, ResourceCost>();
    map.set(0, this.toResourceCost(training, 8, 2, 0, 60, 10));
    map.set(1, this.toResourceCost(training, 13, 3, 0, 120, 15));
    map.set(2, this.toResourceCost(training, 23, 5, 0, 210, 20));
    map.set(3, this.toResourceCost(training, 38, 9, 0, 330, 25));
    map.set(4, this.toResourceCost(training, 60, 15, 0, 750, 50));
    map.set(5, this.toResourceCost(training, 89, 22, 0, 23 * 60, 80));
    map.set(6, this.toResourceCost(training, 125, 31, 0, 38 * 60 + 30, 120));
    map.set(7, this.toResourceCost(training, 168, 42, 0, 58 * 60 + 30, 180));
    map.set(8, this.toResourceCost(training, 218, 54, 0, 83 * 60, 300));
    map.set(9, this.toResourceCost(training, 275, 68, 0, 112 * 60, 480));
    map.set(10, this.toResourceCost(training, 342, 85, 34, 154 * 60, 720));
    map.set(11, this.toResourceCost(training, 419, 104, 41, 210 * 60 + 30, 1050));
    map.set(12, this.toResourceCost(training, 506, 126, 50, 280 * 60 + 30, 1470));
    map.set(13, this.toResourceCost(training, 603, 150, 60, 363 * 60, 1980));
    map.set(14, this.toResourceCost(training, 710, 177, 71, 459 * 60 + 30, 2580));
    map.set(15, this.toResourceCost(training, 827, 206, 82, 569 * 60 + 30, 3270));
    map.set(16, this.toResourceCost(training, 959, 239, 95, 720 * 60, 4050));
    map.set(17, this.toResourceCost(training, 1106, 276, 110, 911 * 60, 4920));
    map.set(18, this.toResourceCost(training, 1268, 317, 126, 1142 * 60 + 30, 5880));
    map.set(19, this.toResourceCost(training, 1445, 361, 144, 1414 * 60 + 30, 6960));
    return map;
  };

  private toResourceCost = (
    training: Training,
    first: number,
    second: number,
    third: number,
    seconds: number,
    reducedSeconds: number
  ): ResourceCost => {
    const resourceCost = {
      fire: 0,
      earth: 0,
      wind: 0,
      water: 0,
      sky: 0,
      seconds,
      reducedSeconds
    };
    switch (training) {
      case 'fire':
        resourceCost.fire = first;
        resourceCost.sky = second;
        resourceCost.earth = third;
        break;
      case 'earth':
        resourceCost.earth = first;
        resourceCost.fire = second;
        resourceCost.wind = third;
        break;
      case 'wind':
        resourceCost.wind = first;
        resourceCost.earth = second;
        resourceCost.water = third;
        break;
      case 'water':
        resourceCost.water = first;
        resourceCost.wind = second;
        resourceCost.sky = third;
        break;
      case 'sky':
        resourceCost.sky = first;
        resourceCost.water = second;
        resourceCost.fire = third;
        break;
      default:
        break;
    }
    return resourceCost;
  };

  getTrainingCostMap = (): Map<string, Map<number, ResourceCost>> => this.trainingCostMap;
}

export default new TrainingConfig();
