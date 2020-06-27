import { executeConcurrent, getFinalPage, makePostMobileRequest, NOBOT_MOBILE_URL, Service } from '@nobot-core/commons';
import { AccountRepository } from '@nobot-core/database';
import { getLogger } from 'log4js';
import { Connection } from 'typeorm/connection/Connection';
import { ResourceCost } from '../tyoes';
import buildConfig from './build-config';

interface MapArea {
  mapId: string;
  building: Building;
  title: string;
  level: number;
  constructing: boolean;
  running: boolean;
}

interface Building {
  type: string;
  title: string;
  facility: string;
}

interface ElementInfo {
  fire: number;
  earth: number;
  wind: number;
  water: number;
  sky: number;
  newUser: boolean;
}

interface BuildTarget {
  type: number;
  mapId: number;
  upgrade: boolean;
  facility: string;
  seconds: number;
}

interface BuildTask {
  stop: boolean;
  interval?: NodeJS.Timeout;
}

@Service()
export default class BuildingService {
  private logger = getLogger(BuildingService.name);

  private buildingList: Building[];

  private buildOrder: { facility: string; max: number }[] = [
    { facility: 'storage', max: 3 },
    { facility: 'food', max: 3 },
    { facility: 'paddy', max: 3 },
    { facility: 'market', max: 1 },
    { facility: 'fire', max: 1 },
    { facility: 'water', max: 1 },
    { facility: 'sky', max: 1 },
    { facility: 'earth', max: 1 },
    { facility: 'wind', max: 1 },
    { facility: 'home_basic', max: 1 }
  ];

  private accountRepository: AccountRepository;

  private buildTasks = new Map<string, BuildTask>();

  constructor(connection: Connection) {
    this.accountRepository = connection.getCustomRepository(AccountRepository);
    this.constructBuildingList();
  }

  startAll = async (): Promise<void> => {
    const accounts = await this.accountRepository.getMobileAccounts();
    await executeConcurrent(
      accounts.map((account) => account.login),
      this.start,
      10
    );
  };

  start = async (login: string): Promise<void> => {
    let task = this.buildTasks.get(login);
    if (task && !task.stop) {
      this.logger.info('Build task is already in progress for %s', login);
    } else {
      task = { stop: false };
      this.buildTasks.set(login, task);
      this.logger.info('Start to build for %s', login);
      await this.startBuild(login);
    }
  };

  stop = (login: string): void => {
    this.logger.info('Stop build for %s', login);
    const task = this.buildTasks.get(login);
    if (task && task.interval) {
      clearInterval(task.interval);
    }
    this.buildTasks.delete(login);
  };

  startBuild = async (login: string): Promise<void> => {
    const page = await getFinalPage(NOBOT_MOBILE_URL.VILLAGE, login);
    const commandInfo = page('#sp_village_command_info');
    if (commandInfo.length > 0 && (commandInfo.html()?.includes('建設中') || commandInfo.html()?.includes('増築中'))) {
      this.logger.info('Build action is still in progress for %s.', login);
    } else {
      const areas = this.getMapInfo(page);
      const elementInfo = this.getElementInfo(page);
      // find the facility to build by order

      this.logger.info('Trying to find build target for %s.', login);
      let buildTarget: BuildTarget | undefined;
      for (let i = 0; i < this.buildOrder.length; i++) {
        const { facility, max } = this.buildOrder[i];
        let area: MapArea | undefined;
        const nb = areas.reduce(
          (count: number, a: MapArea) => (a.building && a.building.facility === facility ? count + 1 : count),
          0
        );
        if (nb < max) {
          // get empty area to construct
          area = areas.find((a) => a.building && a.building.facility === 'free');
        } else {
          // get lowest area to upgrade
          area = areas
            .filter((a) => a.building && a.building.facility === facility)
            .reduce((prev: MapArea | undefined, a: MapArea) => {
              if (a.level < 9 && !a.constructing && (!prev || a.level < prev.level)) {
                return a;
              }
              return prev;
            }, undefined);
        }
        if (area) {
          const buildCost = buildConfig.getBuildCostMap().get(facility)?.get(area.level) as ResourceCost;
          if (this.costEnough(buildCost, elementInfo)) {
            const type = this.buildingList.find((b) => b.facility === facility)?.type as string;
            buildTarget = {
              type: parseInt(type.replace('type', ''), 10),
              mapId: parseInt(area.mapId.replace('map', ''), 10),
              upgrade: area.level !== 0,
              facility,
              seconds: elementInfo.newUser ? buildCost.reducedSeconds : buildCost.seconds
            };
            break;
          }
        }
      }

      if (buildTarget) {
        const { type, mapId, upgrade, facility, seconds } = buildTarget;
        this.logger.info('%s %s for %s', upgrade ? 'upgrade' : 'build', facility, login);
        await makePostMobileRequest(
          NOBOT_MOBILE_URL.BUILDING_RESULT,
          login,
          `id=${mapId}&pt=${upgrade ? 1 : 0}&type=${type}`
        );
        this.logger.info('Wait %d seconds to complete for %s', seconds, login);
        const interval = setTimeout(() => {
          this.startBuild(login);
        }, seconds * 1000);
        const task = this.buildTasks.get(login) as BuildTask;
        this.buildTasks.set(login, {
          ...task,
          interval
        });
      } else {
        this.logger.info('Nothing to build for %s.', login);
        const task = this.buildTasks.get(login) as BuildTask;
        this.buildTasks.set(login, {
          ...task,
          stop: true
        });
      }
    }
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
          building: this.buildingList.find((b) => b.type === type) as Building,
          title,
          level,
          constructing: page(`#buildingimg .${mapId}.constructing`).length > 0,
          running: page(`#buildingimg .${mapId}.running`).length > 0
        });
      }
    }
    return areas;
  };

  private getElementInfo = (page: CheerioStatic): ElementInfo => {
    return {
      fire: parseInt(page('#element_fire').text(), 10),
      earth: parseInt(page('#element_earth').text(), 10),
      wind: parseInt(page('#element_wind').text(), 10),
      water: parseInt(page('#element_water').text(), 10),
      sky: parseInt(page('#element_sky').text(), 10),
      newUser: page('#new-player-button').length > 0
    };
  };

  private costEnough = (buildCost: ResourceCost, elementInfo: ElementInfo): boolean => {
    return (
      buildCost.fire <= elementInfo.fire &&
      buildCost.earth <= elementInfo.earth &&
      buildCost.wind <= elementInfo.wind &&
      buildCost.water <= elementInfo.water &&
      buildCost.sky <= elementInfo.sky
    );
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
